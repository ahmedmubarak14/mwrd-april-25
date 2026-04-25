import * as React from "react";
import { cx } from "../utils/cx";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
    ({ className, ...props }, ref) => (
        <label
            ref={ref}
            className={cx(
                "text-sm font-medium text-secondary leading-none",
                "peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                className,
            )}
            {...props}
        />
    ),
);
Label.displayName = "Label";

export { Label };
