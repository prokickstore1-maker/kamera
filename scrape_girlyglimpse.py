"""
Girly Glimpse (girlyglimpse.com) Full Data Scraper
Extracts all products, categories, brands, tags, shipping rates, and images.
Outputs structured JSON and CSV files.
"""

import os
import sys
import json
import csv
import re
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BASE_API = "https://api.girlyglimpse.com/api/v1"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json"
}

def fetch_json(url):
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode('utf-8'))

def download_file(url, target_path):
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as resp:
        with open(target_path, 'wb') as f:
            f.write(resp.read())

def run_scraper(download_images=False, max_workers=6):
    data_dir = Path("data")
    data_dir.mkdir(parents=True, exist_ok=True)
    
    print("[*] 1. Fetching Products...")
    products_raw = fetch_json(f"{BASE_API}/products?limit=200")
    products = products_raw.get("items", [])
    print(f"    -> Found {len(products)} products (API total: {products_raw.get('total')})")

    print("[*] 2. Fetching Categories...")
    try:
        categories_raw = fetch_json(f"{BASE_API}/categories")
        categories = categories_raw.get("items", [])
    except Exception as e:
        print(f"    -> Categories error: {e}")
        categories = []
    print(f"    -> Found {len(categories)} categories")

    print("[*] 3. Fetching Brands...")
    try:
        brands_raw = fetch_json(f"{BASE_API}/brands")
        brands = brands_raw.get("items", [])
    except Exception as e:
        print(f"    -> Brands error: {e}")
        brands = []
    print(f"    -> Found {len(brands)} brands")

    print("[*] 4. Fetching Tags...")
    try:
        tags_raw = fetch_json(f"{BASE_API}/tags")
        tags = tags_raw.get("items", [])
    except Exception as e:
        print(f"    -> Tags error: {e}")
        tags = []
    print(f"    -> Found {len(tags)} tags")

    print("[*] 5. Fetching Locations (skipped — contains personal contact data)")

    print("[*] 6. Fetching Shipping Rates...")
    try:
        shipping_raw = fetch_json(f"{BASE_API}/shipping-rates")
        shipping_rates = shipping_raw.get("items", [])
    except Exception as e:
        print(f"    -> Shipping rates error: {e}")
        shipping_rates = []
    print(f"    -> Found {len(shipping_rates)} shipping rates")

    # Save raw JSONs
    print("\n[*] Saving JSON files...")
    with open(data_dir / "products.json", "w", encoding="utf-8") as f:
        json.dump(products, f, indent=2, ensure_ascii=False)
    with open(data_dir / "categories.json", "w", encoding="utf-8") as f:
        json.dump(categories, f, indent=2, ensure_ascii=False)
    with open(data_dir / "brands.json", "w", encoding="utf-8") as f:
        json.dump(brands, f, indent=2, ensure_ascii=False)
    with open(data_dir / "tags.json", "w", encoding="utf-8") as f:
        json.dump(tags, f, indent=2, ensure_ascii=False)
    with open(data_dir / "shipping_rates.json", "w", encoding="utf-8") as f:
        json.dump(shipping_rates, f, indent=2, ensure_ascii=False)

    # Transform products for CSV
    print("[*] Generating CSV spreadsheet (products.csv)...")
    csv_rows = []
    total_images_count = 0
    image_download_tasks = []

    for p in products:
        # Prices (IDR only — USD is not used by the store)
        price_idr = None
        for pr in p.get("prices", []):
            if pr.get("currency") == "IDR":
                price_idr = pr.get("amount")

        # Tags breakdown
        p_tags = p.get("tags", [])
        condition_tags = [t["name"] for t in p_tags if t.get("kind") == "condition"]
        promo_tags = [t["name"] for t in p_tags if t.get("kind") == "promo"]
        all_tags = [t["name"] for t in p_tags]

        # Specifications formatted
        specs_list = p.get("specifications", [])
        specs_str = "; ".join([f"{s.get('key')}: {s.get('value')}" for s in specs_list if s.get('key')])

        # Features
        features_list = p.get("features", [])
        features_str = " | ".join(features_list) if isinstance(features_list, list) else str(features_list)

        # Images
        imgs = p.get("images", [])
        total_images_count += len(imgs)
        primary_img = ""
        all_img_urls = []
        for idx, img in enumerate(imgs):
            img_url = img.get("url")
            if img_url:
                all_img_urls.append(img_url)
                if img.get("is_primary") or idx == 0 and not primary_img:
                    primary_img = img_url

                # Image download task
                filename = os.path.basename(img.get("object_key", f"img_{idx}.jpeg"))
                target_path = data_dir / "images" / p.get("slug", p.get("id")) / filename
                image_download_tasks.append((img_url, target_path))

        # Condition source text parsing (details is a free-form string)
        details_text = (p.get("details") or "").strip()
        grade_match = re.search(r"([0-9]+(?:\.[0-9]+)?)\s*/\s*(?:[0-9]+)?\s*body condition", details_text, re.IGNORECASE)
        condition_grade = float(grade_match.group(1)) if grade_match else None

        defects_match = re.search(r"minus/defects\s*:\s*(.*?)(?:\n\n|inclusions\s*:)", details_text, re.IGNORECASE | re.DOTALL)
        defects_raw = defects_match.group(1).strip() if defects_match else ""
        # "❌❌" is the seller's shorthand for "no defects"
        defects = None if not defects_raw or not re.search(r"[A-Za-z]", defects_raw) else defects_raw.strip("❕ ").strip()

        inclusions_match = re.search(r"inclusions\s*:\s*(.*)$", details_text, re.IGNORECASE | re.DOTALL)
        inclusions_text = inclusions_match.group(1).strip() if inclusions_match else ""
        inclusions_text = re.sub(r"[⊹࣪˖📦☆彡]", " ", inclusions_text)
        inclusions = [i.strip(" .&,") for i in re.split(r",|\band\b", inclusions_text) if i.strip(" .&,")]

        row = {
            "id": p.get("id"),
            "name": p.get("name"),
            "slug": p.get("slug"),
            "product_url": f"https://girlyglimpse.com/products/{p.get('slug')}",
            "brand": p.get("brand", {}).get("name") if p.get("brand") else "",
            "category": p.get("category", {}).get("name") if p.get("category") else "",
            "condition": ", ".join(condition_tags),
            "condition_grade": condition_grade if condition_grade is not None else "",
            "defects": defects or "",
            "inclusions": " | ".join(filter(None, inclusions)),
            "promo_tags": ", ".join(promo_tags),
            "all_tags": ", ".join(all_tags),
            "price_idr": price_idr if price_idr is not None else p.get("display_price", ""),
            "stock": p.get("stock", 0),
            "weight_grams": p.get("weight_grams", 0),
            "active": p.get("active", True),
            "featured": p.get("featured", False),
            "image_count": len(imgs),
            "primary_image_url": primary_img,
            "all_image_urls": " | ".join(all_img_urls),
            "features": features_str,
            "specifications": specs_str,
            "details_raw": details_text,
            "description": p.get("description", "").strip(),
            "created_at": p.get("created_at"),
            "updated_at": p.get("updated_at")
        }
        csv_rows.append(row)

    if csv_rows:
        fieldnames = list(csv_rows[0].keys())
        with open(data_dir / "products.csv", "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(csv_rows)

    # Summary
    summary = {
        "source": "https://girlyglimpse.com",
        "scraped_at": str(Path("data").stat().st_mtime),
        "total_products": len(products),
        "total_images": total_images_count,
        "total_categories": len(categories),
        "total_brands": len(brands),
        "total_tags": len(tags),
        "total_shipping_rates": len(shipping_rates),
        "brands_list": [b.get("name") for b in brands],
        "categories_list": [c.get("name") for c in categories],
        "conditions_found": list(set([r["condition"] for r in csv_rows if r["condition"]])),
        "price_range_idr": {
            "min": min([r["price_idr"] for r in csv_rows if isinstance(r["price_idr"], (int, float))] or [0]),
            "max": max([r["price_idr"] for r in csv_rows if isinstance(r["price_idr"], (int, float))] or [0])
        }
    }
    with open(data_dir / "summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)

    print("\n[+] Scrape completed successfully!")
    print(f"    - Products: {len(products)}")
    print(f"    - Total images in catalog: {total_images_count}")
    print(f"    - Files written to '{data_dir.resolve()}':")
    print("      * products.json")
    print("      * products.csv")
    print("      * categories.json")
    print("      * brands.json")
    print("      * tags.json")
    print("      * shipping_rates.json")
    print("      * summary.json")

    if download_images:
        print(f"\n[*] Starting download of {len(image_download_tasks)} images (workers={max_workers})...")
        downloaded = 0
        failed = 0
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_url = {executor.submit(download_file, url, target): (url, target) for url, target in image_download_tasks}
            for future in as_completed(future_to_url):
                url, target = future_to_url[future]
                try:
                    future.result()
                    downloaded += 1
                    if downloaded % 10 == 0 or downloaded == len(image_download_tasks):
                        print(f"    -> Downloaded {downloaded}/{len(image_download_tasks)} images...")
                except Exception as exc:
                    failed += 1
                    print(f"    [!] Failed to download {url}: {exc}")
        print(f"[+] Image download complete! {downloaded} downloaded, {failed} failed.")

if __name__ == "__main__":
    download_flag = "--download-images" in sys.argv
    run_scraper(download_images=download_flag)
