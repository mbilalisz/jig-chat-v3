import React from "react"
import { Textarea as ShadcnTextarea } from "@/components/ui/Textarea"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <ShadcnTextarea
        className={className}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"
