import { FIREWALL_LOCALES, type FirewallLocale } from "../firewall/locale";

export function localeFromPath(pathname: string): FirewallLocale {
  const first = pathname.split("/")[1];
  return FIREWALL_LOCALES.includes(first as FirewallLocale) ? first as FirewallLocale : "en";
}

export function localePath(pathname: string, locale: FirewallLocale): string {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return pathname;
  const current = localeFromPath(pathname);
  const plain = current === "en" ? pathname : pathname.slice(current.length + 1) || "/";
  return locale === "en" ? plain : `/${locale}${plain}`;
}
