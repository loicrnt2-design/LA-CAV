import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, isLocale, makeT, pickFromAcceptLanguage, type Locale } from "./i18n";
import { currentUser } from "./auth";

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get("lang")?.value;
  if (isLocale(c)) return c;
  const user = await currentUser();
  if (user && isLocale(user.locale)) return user.locale;
  return pickFromAcceptLanguage((await headers()).get("accept-language")) ?? DEFAULT_LOCALE;
}

export async function getT() {
  const locale = await getLocale();
  return { locale, t: makeT(locale) };
}
