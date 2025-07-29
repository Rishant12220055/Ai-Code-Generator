import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { format } from 'date-fns';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-gray-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const formattedChildren =
    typeof props.children === "string" && !isNaN(Date.parse(props.children))
      ? format(new Date(props.children), "yyyy-MM-dd")
      : props.children || "";

  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {formattedChildren}
    </div>
  );
}

export { Badge, badgeVariants }
