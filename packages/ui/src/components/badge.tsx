import type { ReactNode } from "react";
import { cx } from "../utils/cx";

// ─── Types ───────────────────────────────────────────────────────────────────

export type BadgeColor =
    | "gray"
    | "brand"
    | "error"
    | "warning"
    | "success"
    | "blue-gray"
    | "blue-light"
    | "blue"
    | "indigo"
    | "violet"
    | "purple"
    | "pink"
    | "rose"
    | "orange";

export type BadgeSize = "sm" | "md" | "lg";

export type BadgeType = "pill-color" | "pill-outline" | "badge-color" | "badge-modern";

export interface BadgeProps {
    children: ReactNode;
    color?: BadgeColor;
    size?: BadgeSize;
    type?: BadgeType;
    className?: string;
}

// ─── Style maps ──────────────────────────────────────────────────────────────

const colorMap: Record<BadgeColor, string> = {
    gray: "bg-utility-gray-50 text-utility-gray-700 ring-utility-gray-200",
    brand: "bg-utility-brand-50 text-utility-brand-700 ring-utility-brand-200",
    error: "bg-utility-error-50 text-utility-error-700 ring-utility-error-200",
    warning: "bg-utility-warning-50 text-utility-warning-700 ring-utility-warning-200",
    success: "bg-utility-success-50 text-utility-success-700 ring-utility-success-200",
    "blue-gray": "bg-utility-blue-gray-50 text-utility-blue-gray-700 ring-utility-blue-gray-200",
    "blue-light": "bg-utility-blue-light-50 text-utility-blue-light-700 ring-utility-blue-light-200",
    blue: "bg-utility-blue-50 text-utility-blue-700 ring-utility-blue-200",
    indigo: "bg-utility-indigo-50 text-utility-indigo-700 ring-utility-indigo-200",
    violet: "bg-utility-violet-50 text-utility-violet-700 ring-utility-violet-200",
    purple: "bg-utility-purple-50 text-utility-purple-700 ring-utility-purple-200",
    pink: "bg-utility-pink-50 text-utility-pink-700 ring-utility-pink-200",
    rose: "bg-utility-rose-50 text-utility-rose-700 ring-utility-rose-200",
    orange: "bg-utility-orange-50 text-utility-orange-700 ring-utility-orange-200",
};

const outlineColorMap: Record<BadgeColor, string> = {
    gray: "text-utility-gray-700 ring-utility-gray-300",
    brand: "text-utility-brand-700 ring-utility-brand-300",
    error: "text-utility-error-700 ring-utility-error-300",
    warning: "text-utility-warning-700 ring-utility-warning-300",
    success: "text-utility-success-700 ring-utility-success-300",
    "blue-gray": "text-utility-blue-gray-700 ring-utility-blue-gray-300",
    "blue-light": "text-utility-blue-light-700 ring-utility-blue-light-300",
    blue: "text-utility-blue-700 ring-utility-blue-300",
    indigo: "text-utility-indigo-700 ring-utility-indigo-300",
    violet: "text-utility-violet-700 ring-utility-violet-300",
    purple: "text-utility-purple-700 ring-utility-purple-300",
    pink: "text-utility-pink-700 ring-utility-pink-300",
    rose: "text-utility-rose-700 ring-utility-rose-300",
    orange: "text-utility-orange-700 ring-utility-orange-300",
};

const sizeMap: Record<BadgeSize, { pill: string; badge: string }> = {
    sm: { pill: "px-2 py-0.5 text-xs font-medium", badge: "px-1.5 py-0.5 text-xs font-medium" },
    md: { pill: "px-2.5 py-0.5 text-sm font-medium", badge: "px-2 py-0.5 text-sm font-medium" },
    lg: { pill: "px-3 py-1 text-sm font-medium", badge: "px-2.5 py-1 text-sm font-medium" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export function Badge({
    children,
    color = "gray",
    size = "md",
    type = "pill-color",
    className,
}: BadgeProps) {
    const isPill = type === "pill-color" || type === "pill-outline";
    const isOutline = type === "pill-outline";
    const isModern = type === "badge-modern";

    const shapeClasses = isPill ? "rounded-full" : "rounded";
    const sizeClasses = isPill ? sizeMap[size].pill : sizeMap[size].badge;

    const colorClasses = isOutline
        ? cx("bg-transparent ring-1 ring-inset", outlineColorMap[color])
        : isModern
          ? cx("bg-white text-secondary-fg shadow-xs ring-1 ring-inset ring-secondary")
          : cx("ring-1 ring-inset", colorMap[color]);

    return (
        <span
            className={cx(
                "inline-flex items-center gap-1",
                shapeClasses,
                sizeClasses,
                colorClasses,
                className,
            )}
        >
            {children}
        </span>
    );
}

// ─── Dot indicator ───────────────────────────────────────────────────────────

const dotColorMap: Record<BadgeColor, string> = {
    gray: "bg-utility-gray-500",
    brand: "bg-utility-brand-500",
    error: "bg-utility-error-500",
    warning: "bg-utility-warning-500",
    success: "bg-utility-success-500",
    "blue-gray": "bg-utility-blue-gray-500",
    "blue-light": "bg-utility-blue-light-500",
    blue: "bg-utility-blue-500",
    indigo: "bg-utility-indigo-500",
    violet: "bg-utility-violet-500",
    purple: "bg-utility-purple-500",
    pink: "bg-utility-pink-500",
    rose: "bg-utility-rose-500",
    orange: "bg-utility-orange-500",
};

export function BadgeDot({ color = "gray" }: { color?: BadgeColor }) {
    return <span className={cx("inline-block h-1.5 w-1.5 rounded-full", dotColorMap[color])} />;
}
