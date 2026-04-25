"use client";

import { useEffect } from "react";

/**
 * Sets lang, dir and body font class on the <html>/<body> elements that live
 * in the root layout. Must be a client component so it runs after hydration.
 * suppressHydrationWarning on <html> and <body> (in the root layout) silences
 * the server→client attribute mismatch.
 */
export function LocaleAttributes({
    locale,
    dir,
    bodyClass,
}: {
    locale: string;
    dir: "ltr" | "rtl";
    bodyClass: string;
}) {
    useEffect(() => {
        document.documentElement.lang = locale;
        document.documentElement.dir = dir;
        document.body.className = bodyClass;
    }, [locale, dir, bodyClass]);

    return null;
}
