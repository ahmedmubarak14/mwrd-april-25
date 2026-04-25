import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge v2 API: extend classGroups so it knows display-* are font-size classes
 * and won't strip them as unknown.
 */
const twMerge = extendTailwindMerge({
    extend: {
        classGroups: {
            "font-size": [
                "text-display-xs",
                "text-display-sm",
                "text-display-md",
                "text-display-lg",
                "text-display-xl",
                "text-display-2xl",
                // Untitled UI also adds text-md (between sm and lg) as a step
                "text-md",
            ],
        },
    },
});

export const cx = twMerge;

export function sortCx<
    T extends Record<
        string,
        string | number | Record<string, string | number | Record<string, string | number>>
    >,
>(classes: T): T {
    return classes;
}
