import AxeBuilder from "@axe-core/playwright";
import { type Page, expect } from "@playwright/test";

// WCAG 2.2 A and AA (Sprint 11b spec §5.5).
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa"];

function summary(violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"]): string[] {
  return violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(" ")).join(" | ")}`);
}

export async function expectNoViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  expect(summary(results.violations), label).toEqual([]);
}

// The admin gets the names-and-labels rules only (spec §5.3).
const ADMIN_RULES = ["label", "button-name", "link-name", "aria-input-field-name", "select-name", "scrollable-region-focusable"];

export async function expectNoAdminLabelViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withRules(ADMIN_RULES).analyze();
  expect(summary(results.violations), label).toEqual([]);
}
