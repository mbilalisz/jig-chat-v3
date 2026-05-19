import React from "react"
import { Input as ShadcnInput } from "@/components/ui/Input"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <ShadcnInput
        type={type}
        className={className}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"
