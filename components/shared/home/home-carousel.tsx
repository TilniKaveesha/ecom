'use client'

import * as React from 'react'
import Image from 'next/image'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from "embla-carousel-react"
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { EmblaCarouselType } from "embla-carousel"
import { useTranslations } from 'next-intl'
import { ICarousel } from '@/types'

export function HomeCarousel({ items }: { items: ICarousel[] }) {
  const t = useTranslations('Home')

  const [isPlaying] = React.useState(true)
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [canScrollNext, setCanScrollNext] = React.useState(true)
  const [canScrollPrev, setCanScrollPrev] = React.useState(false)

  const autoplayPlugin = React.useRef(
    Autoplay({
      delay: 4000,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      playOnInit: true,
    }),
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      skipSnaps: false,
      dragFree: false,
    },
    [autoplayPlugin.current],
  )

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const scrollTo = React.useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi],
  )

  const onSelect = React.useCallback((embla: EmblaCarouselType) => {
    setSelectedIndex(embla.selectedScrollSnap())
    setCanScrollPrev(embla.canScrollPrev())
    setCanScrollNext(embla.canScrollNext())
  }, [])

  React.useEffect(() => {
    if (!emblaApi) return

    onSelect(emblaApi)
    emblaApi.on("reInit", onSelect)
    emblaApi.on("select", onSelect)

    return () => {
      emblaApi.off("reInit", onSelect)
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi, onSelect])

  React.useEffect(() => {
    if (!emblaApi) return

    const handleMouseEnter = () => {
      const autoplay = autoplayPlugin.current
      if (autoplay && isPlaying) {
        autoplay.stop()
      }
    }

    const handleMouseLeave = () => {
      const autoplay = autoplayPlugin.current
      if (autoplay && isPlaying) {
        autoplay.play()
      }
    }

    const emblaNode = emblaApi.rootNode()
    if (emblaNode) {
      emblaNode.addEventListener("mouseenter", handleMouseEnter)
      emblaNode.addEventListener("mouseleave", handleMouseLeave)

      return () => {
        emblaNode.removeEventListener("mouseenter", handleMouseEnter)
        emblaNode.removeEventListener("mouseleave", handleMouseLeave)
      }
    }
  }, [emblaApi, isPlaying])
  // We'll pass onSelect to Carousel's onSelect prop (if supported)
  // Or use emblaApi event listener (adjust depending on your Carousel component API)

  return (
    <div className="relative group">
      {/* Main Carousel */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="flex-[0_0_100%] min-w-0">
              <Link href={item.url} className="block group/item w-full h-full">
                <div className="relative aspect-[16/9] md:aspect-[16/6] w-full overflow-hidden">
                  <Image
                    src={item.image || "/placeholder.svg"}
                    alt={item.title || "Carousel image"}
                    fill
                    className="object-cover transition-transform duration-700 ease-in-out group-hover/item:scale-105"
                    priority={index === 0}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent z-10" />

                  {/* Content */}
                  <div className="absolute top-1/2 left-4 md:left-20 -translate-y-1/2 z-20 max-w-[90%] md:max-w-[40%]">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-lg mb-4 md:mb-6 animate-in slide-in-from-left-8 duration-700">
                      {t(item.title)}
                    </h2>
                    <Button
                      className="bg-tk-accent hover:bg-tk-accent/90 text-white font-medium tracking-wide 
                                px-8 py-4 md:px-10 md:py-5 text-lg md:text-xl
                                rounded-none border-2 border-white/30 hover:border-white/50
                                transition-all duration-300 transform hover:scale-105 hover:shadow-xl
                                shadow-md animate-in slide-in-from-left-8 delay-200"
                      variant="default"
                    >
                      {t(item.buttonCaption)}
                      <span className="ml-3 opacity-0 group-hover/item:opacity-100 transition-opacity duration-300">
                        →
                      </span>
                    </Button>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={scrollPrev}
        className="absolute top-1/2 -translate-y-1/2 left-2 md:left-6 z-30 
                   bg-white/80 hover:bg-white text-black w-12 h-12 rounded-full 
                   transition-all duration-200 flex items-center justify-center shadow-lg
                   opacity-0 group-hover:opacity-100 hover:scale-110
                   disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Previous slide"
        disabled={!canScrollPrev && !emblaApi?.canScrollPrev()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15,18 9,12 15,6"></polyline>
        </svg>
      </button>

      <button
        onClick={scrollNext}
        className="absolute top-1/2 -translate-y-1/2 right-2 md:right-6 z-30 
                   bg-white/80 hover:bg-white text-black w-12 h-12 rounded-full 
                   transition-all duration-200 flex items-center justify-center shadow-lg
                   opacity-0 group-hover:opacity-100 hover:scale-110
                   disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Next slide"
        disabled={!canScrollNext && !emblaApi?.canScrollNext()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="9,18 15,12 9,6"></polyline>
        </svg>
      </button>

      {/* Dots Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === selectedIndex ? "bg-white scale-110" : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-30">
        <div
          className="h-full bg-tk-accent transition-all duration-100 ease-linear"
          style={{
            width: `${((selectedIndex + 1) / items.length) * 100}%`,
          }}
        />
      </div>
    </div>
  )
}
