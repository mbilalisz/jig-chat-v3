import React from "react"
import { Button as ShadcnButton, buttonVariants } from "@/components/ui/Button"
import { type VariantProps } from "class-variance-authority"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <ShadcnButton
        className={className}
        variant={variant}
        size={size}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"
