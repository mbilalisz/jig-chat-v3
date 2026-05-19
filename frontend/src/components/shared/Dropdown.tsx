import React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuShortcut,
  DropdownMenuGroup,
} from "@/components/ui/DropdownMenu"

interface DropdownItem {
  label: string
  onClick?: () => void
  icon?: React.ReactNode
  shortcut?: string
  variant?: "default" | "destructive"
}

interface DropdownProps {
  trigger: React.ReactNode
  label?: string
  items: DropdownItem[]
  className?: string
}

export const Dropdown: React.FC<DropdownProps> = ({ trigger, label, items, className }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent className={className} align="end">
        {label && (
          <>
            <DropdownMenuLabel>{label}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuGroup>
          {items.map((item, index) => (
            <DropdownMenuItem
              key={index}
              onClick={item.onClick}
              className={item.variant === "destructive" ? "text-red-600 focus:text-red-600 focus:bg-red-50" : ""}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              <span>{item.label}</span>
              {item.shortcut && (
                <DropdownMenuShortcut>{item.shortcut}</DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
