import Link from "next/link"
import { Utensils, ArrowRight } from "lucide-react"

interface BrandLogoProps {
  variant?: "default" | "simple"
  size?: "sm" | "md" | "lg"
  href?: string | null
}

export function BrandLogo({ variant = "default", size = "md", href = "/user/home" }: BrandLogoProps) {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  }

  const logo = (
    <>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-brand-primary rounded-full opacity-20 animate-pulse-slow"></div>
        <Utensils
          className={`text-brand-primary ${size === "sm" ? "h-5 w-5" : size === "md" ? "h-6 w-6" : "h-8 w-8"}`}
        />
      </div>
      {variant === "default" && (
        <div className={`flex items-center ${sizeClasses[size]}`}>
          <span className="text-brand-primary">Eat</span>
          <ArrowRight
            className={`${size === "sm" ? "h-3 w-3" : size === "md" ? "h-4 w-4" : "h-5 w-5"} text-brand-secondary mx-0.5`}
          />
          <span className="text-brand-secondary">Move</span>
        </div>
      )}
    </>
  )

  // If href is null, don't wrap in a Link
  if (href === null) {
    return <div className="flex items-center gap-1.5 font-bold">{logo}</div>
  }

  return (
    <Link href={href} className="flex items-center gap-1.5 font-bold">
      {logo}
    </Link>
  )
}
