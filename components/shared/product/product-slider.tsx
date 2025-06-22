"use client"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import ProductCard from "./product-card"
import type { IProduct } from "@/lib/db/models/product.model"
import { cn } from "@/lib/utils"

export default function ProductSlider({
  title,
  products,
  hideDetails = false,
}: {
  title?: string
  products: IProduct[]
  hideDetails?: boolean
}) {
  return (
    <div className="w-full bg-background">
      {title && (
        <div className="mb-8">
          <h2 className="h2-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-black/90">
            {title}
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/50 rounded-full mt-2" />
        </div>
      )}

      <div className="relative group">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {products.map((product, index) => (
              <CarouselItem
                key={product.slug}
                className={cn(
                  "pl-2 md:pl-4 transition-all duration-300 ease-out",
                  hideDetails
                    ? "basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6"
                    : "basis-1/1 sm:basis-1/2 md:basis-1/3 lg:basis-1/5",
                  "hover:scale-[1.02] hover:z-10",
                )}
                style={{
                  animationDelay: `${index * 100}ms`,
                }}
              >
                <div className="h-full transform transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 rounded-lg">
                  <ProductCard hideDetails={hideDetails} hideAddToCart hideBorder product={product} />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Enhanced Navigation Buttons */}
          <CarouselPrevious
            className={cn(
              "left-0 -translate-x-1/2 bg-background/80 backdrop-blur-sm border-2",
              "hover:bg-primary hover:text-primary-foreground hover:border-primary",
              "transition-all duration-300 shadow-lg hover:shadow-xl",
              "opacity-0 group-hover:opacity-100 hover:scale-110",
              "disabled:opacity-50 disabled:hover:scale-100",
            )}
          />
          <CarouselNext
            className={cn(
              "right-0 translate-x-1/2 bg-background/80 backdrop-blur-sm border-2",
              "hover:bg-primary hover:text-primary-foreground hover:border-primary",
              "transition-all duration-300 shadow-lg hover:shadow-xl",
              "opacity-0 group-hover:opacity-100 hover:scale-110",
              "disabled:opacity-50 disabled:hover:scale-100",
            )}
          />
        </Carousel>

        {/* Gradient Overlays for Visual Enhancement */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none z-10" />
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-center mt-6 space-x-2">
        {Array.from({ length: Math.ceil(products.length / (hideDetails ? 6 : 5)) }).map((_, index) => (
          <div key={index} className="h-1.5 w-8 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary/30 rounded-full transition-all duration-300" />
          </div>
        ))}
      </div>
    </div>
  )
}
