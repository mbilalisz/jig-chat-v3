import React from "react"
import { Switch as ShadcnSwitch } from "@/components/ui/Switch"

interface SwitchProps {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, disabled, className }) => {
  return (
    <ShadcnSwitch
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={className}
    />
  )
}
