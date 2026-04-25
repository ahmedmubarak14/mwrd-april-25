import { getRequestConfig } from "next-intl/server";
import { routing, isValidLocale } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isValidLocale(requested) ? requested : routing.defaultLocale;

  const messages = (await import(`../messages/${locale}.json`)).default;

  return { locale, messages };
});
