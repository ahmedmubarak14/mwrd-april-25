// ── Utilities ────────────────────────────────────────────────────────────────
export { cn } from "./lib/utils";
export { cx, sortCx } from "./utils/cx";
export { isReactComponent, isFunctionComponent, isForwardRefComponent, isClassComponent } from "./utils/is-react-component";

// ── Deprecated – kept for backward compat (Tailwind v4 no longer uses config presets) ──
export { mwrdPreset } from "./tailwind-preset";

// ── Logo ─────────────────────────────────────────────────────────────────────
export { Logo } from "./components/logo";
export type { LogoProps, LogoVariant, LogoLocale } from "./components/logo";

// ── Base components ───────────────────────────────────────────────────────────
export { Button } from "./components/button";
export type { ButtonProps, Props as ButtonOrLinkProps } from "./components/button";

export { Input } from "./components/input";
export type { InputProps } from "./components/input";

export { Label } from "./components/label";
export type { LabelProps } from "./components/label";

export {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
} from "./components/card";

export { Badge, BadgeDot } from "./components/badge";
export type { BadgeProps, BadgeColor, BadgeSize, BadgeType } from "./components/badge";
