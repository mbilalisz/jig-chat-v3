import React from "react"
import { Avatar as ShadcnAvatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar"

interface AvatarProps {
  src?: string
  alt?: string
  fallback?: string
  className?: string
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, className }) => {
  return (
    <ShadcnAvatar className={className}>
      <AvatarImage src={src} alt={alt} />
      <AvatarFallback>{fallback || alt?.substring(0, 2).toUpperCase()}</AvatarFallback>
    </ShadcnAvatar>
  )
}
