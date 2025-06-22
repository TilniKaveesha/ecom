"use client"

import Image from "next/image"
import { useState, useRef } from "react"
import { cn } from "@/lib/utils"

type ImageHoverProps = {
  src: string
  hoverSrc: string
  alt: string
}

const ImageHover = ({ src, hoverSrc, alt }: ImageHoverProps) => {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hoverImageLoaded, setHoverImageLoaded] = useState(false)
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    hoverTimeout.current = setTimeout(() => setIsHovered(true), 800) // Slightly faster delay
  }

  const handleMouseLeave = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current)
    setIsHovered(false)
  }

  return (
    <div
      className="relative h-52 aspect-[1/1] overflow-hidden cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading shimmer effect */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-shimmer" />
        </div>
      )}

      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Main Image */}
      <Image
        src={src || "/placeholder.svg"}
        alt={alt}
        fill
        sizes="(min-width: 768px) 33vw, 80vw"
        className={cn(
          "object-contain transition-all duration-700 ease-out transform-gpu",
          "filter group-hover:brightness-110 group-hover:contrast-105",
          isHovered ? "opacity-0 scale-95 rotate-1 blur-sm" : "opacity-100 scale-100 rotate-0 blur-0",
        )}
        onLoad={() => setIsLoading(false)}
        aria-hidden={isHovered}
        priority
      />

      {/* Hover Image */}
      <Image
        src={hoverSrc || "/placeholder.svg"}
        alt={`${alt} - alternate view`}
        fill
        sizes="(min-width: 768px) 33vw, 80vw"
        className={cn(
          "absolute inset-0 object-contain transition-all duration-700 ease-out transform-gpu",
          "filter brightness-110 contrast-105 saturate-110",
          isHovered ? "opacity-100 scale-100 rotate-0 blur-0" : "opacity-0 scale-105 -rotate-1 blur-sm",
        )}
        onLoad={() => setHoverImageLoaded(true)}
        aria-hidden={!isHovered}
      />

      {/* Subtle border glow effect */}
      <div
        className={cn(
          "absolute inset-0 rounded-lg border-2 border-transparent transition-all duration-500",
          "group-hover:border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10",
        )}
      />

      {/* Corner accent */}
      <div className="absolute top-2 right-2 w-3 h-3 bg-gradient-to-br from-primary/30 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300" />

      {/* Loading indicator for hover image */}
      {isHovered && !hoverImageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}

      {/* Hover progress indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div
          className={cn(
            "h-full bg-gradient-to-r from-primary to-secondary transition-all duration-800 ease-out",
            isHovered ? "w-full" : "w-0",
          )}
        />
      </div>

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "absolute w-1 h-1 bg-primary/30 rounded-full",
              "opacity-0 group-hover:opacity-100",
              "transition-all duration-1000 ease-out",
              isHovered ? "animate-float" : "",
            )}
            style={{
              left: `${20 + i * 30}%`,
              top: `${30 + i * 20}%`,
              animationDelay: `${i * 200}ms`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

export default ImageHover
