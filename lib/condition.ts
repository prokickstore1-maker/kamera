/**
 * Label kondisi diturunkan dari condition_grade.
 * MVP: ≥9.5 Like New, ≥9 Excellent, ≥8 Very Good, ≥6 Good, <6 Used.
 * "Brand New" TIDAK pernah diturunkan dari skor — hanya dari tag `brand-new`.
 */
export function conditionLabel(grade: number | string | null | undefined): string | null {
  if (grade === null || grade === undefined || grade === "") return null;
  const n = typeof grade === "number" ? grade : parseFloat(grade);
  if (Number.isNaN(n)) return null;
  if (n >= 9.5) return "Like New";
  if (n >= 9) return "Excellent";
  if (n >= 8) return "Very Good";
  if (n >= 6) return "Good";
  return "Used";
}
