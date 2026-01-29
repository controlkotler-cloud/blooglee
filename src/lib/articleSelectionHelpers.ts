import type { ArticuloEmpresa } from "@/hooks/useArticulosEmpresas";
import type { Empresa } from "@/hooks/useEmpresas";

/**
 * Returns the correct article for a company based on its publish_frequency.
 * - monthly: most recent article for the month/year
 * - weekly: most recent article for the current week_of_month
 * - daily: most recent article generated today
 */
export function getCompanyArticleForPeriod(
  company: Empresa,
  articulosEmpresas: ArticuloEmpresa[],
  selectedMonth: number,
  selectedYear: number
): ArticuloEmpresa | null {
  const now = new Date();
  const currentDay = now.getDate();
  const currentWeekOfMonth = Math.ceil(currentDay / 7);
  const frequency = company.publish_frequency || "monthly";

  // Filter articles for this company in the selected month/year
  let filtered = articulosEmpresas.filter(
    (a) =>
      a.empresa_id === company.id &&
      a.month === selectedMonth &&
      a.year === selectedYear
  );

  if (filtered.length === 0) return null;

  // Apply frequency-specific filtering
  if (frequency === "daily") {
    // Only articles generated today
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    filtered = filtered.filter(
      (a) => new Date(a.generated_at) >= todayStart
    );
  } else if (frequency === "weekly") {
    // Only articles from the current week_of_month
    filtered = filtered.filter((a) => a.week_of_month === currentWeekOfMonth);
  }
  // For monthly, we already have all articles from the month

  if (filtered.length === 0) return null;

  // Sort by generated_at descending and return the most recent
  filtered.sort(
    (a, b) => new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
  );

  return filtered[0];
}

/**
 * Checks if a company has an article for the current period based on frequency.
 */
export function hasArticleForCurrentPeriod(
  company: Empresa,
  articulosEmpresas: ArticuloEmpresa[],
  selectedMonth: number,
  selectedYear: number
): boolean {
  return getCompanyArticleForPeriod(company, articulosEmpresas, selectedMonth, selectedYear) !== null;
}
