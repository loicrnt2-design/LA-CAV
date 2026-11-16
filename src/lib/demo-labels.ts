import type { T } from "./i18n";

export function demoErrors(t: T) {
  return {
    unavailable: t("demo.unavailable"),
    changed: t("demo.changed"),
    invalid: t("demo.invalid"),
    not_found: t("demo.notFound"),
  };
}
