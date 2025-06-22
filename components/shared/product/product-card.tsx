import Image from "next/image"
import Link from "next/link"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import type { IProduct } from "@/lib/db/models/product.model"

import Rating from "./rating"
import { formatNumber, generateId, round2 } from "@/lib/utils"
import ProductPrice from "./product-price"
import ImageHover from "./image-hover"
import { cn } from "@/lib/utils"
import AddToCart from "./add-to-cart"

const ProductCard = ({
  product,
  hideBorder = false,
  hideDetails = false,
  hideAddToCart = false
}: {
  product: IProduct
  hideDetails?: boolean
  hideBorder?: boolean
  hideAddToCart?: boolean
}) => {
  const ProductImage = () => (
    <Link href={`/product/${product.slug}`} className="block group relative">
      <div className="relative h-52 sm:h-56 md:h-64 overflow-hidden rounded-lg to-gray-100 flex items-center justify-center">
        {/* Shimmer effect background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparentto-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />

        {product.images.length > 1 ? (
          <ImageHover src={product.images[0] || "/placeholder.svg"} hoverSrc={product.images[1]} alt={product.name} />
        ) : (
          <Image
            src={product.images[0] || "/placeholder.svg"}
            alt={product.name}
            fill
            sizes="(min-width: 768px) 33vw, 80vw"
            className="object-contain transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
          />
        )}

        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-gary-200/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Deal badge */}
        {product.tags.includes("todays-deal") && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg animate-pulse">
            DEAL
          </div>
        )}
      </div>
    </Link>
  )

  const ProductDetails = () => (
    <div className="flex-1 space-y-3 text-center">
      {/* Brand */}
      <p className="font-medium text-sm text-muted-foreground/80 uppercase tracking-wider transition-colors group-hover:text-primary/70">
        {product.brand}
      </p>

      {/* Product Name */}
      <Link
        href={`/product/${product.slug}`}
        className={cn(
          "block text-base font-semibold text-foreground hover:text-primary",
          "transition-all duration-300 overflow-hidden",
          "hover:scale-[1.02] transform-gpu",
          "leading-tight min-h-[3rem] flex items-center justify-center",
        )}
        style={{
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
        }}
      >
        {product.name}
      </Link>

      {/* Rating */}
      <div className="flex justify-center items-center gap-2 text-sm min-h-[1.5rem]">
        <div className="transform transition-transform duration-300 hover:scale-110">
          <Rating rating={product.avgRating} />
        </div>
        <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          ({formatNumber(product.numReviews)})
        </span>
      </div>

      {/* Price */}
      <div className="transform transition-all duration-300 hover:scale-105 min-h-[2rem] flex items-center justify-center">
        <ProductPrice
          isDeal={product.tags.includes("todays-deal")}
          price={product.price}
          listPrice={product.listPrice}
          forListing
        />
      </div>
    </div>
  )
  const AddButton = () => (
    <div className='w-full text-center'>
      <AddToCart
        minimal
        item={{
          clientId: generateId(),
          product: product._id,
          size: product.sizes[0],
          color: product.colors[0],
          countInStock: product.countInStock,
          name: product.name,
          slug: product.slug,
          category: product.category,
          price: round2(product.price),
          quantity: 1,
          image: product.images[0],
        }}
      />
    </div>
  )

  return hideBorder ? (
    <div className="flex flex-col h-full group cursor-pointer">
      <div className="transform transition-all duration-500 ease-out group-hover:translate-y-[-4px]">
        <ProductImage />
      </div>
      {!hideDetails && (
        <div className="p-4 flex-1 flex flex-col justify-between transform transition-all duration-300 group-hover:translate-y-[-2px]">
          <ProductDetails />
        </div>
      )}
      {!hideAddToCart && (
        <div className="p-4 transform transition-all duration-300 group-hover:translate-y-[-2px]">
          <AddButton />
        </div>
      )}
    </div>
  ) : (
    <Card
      className={cn(
        "flex flex-col h-full group cursor-pointer overflow-hidden",
        "border-0 shadow-sm hover:shadow-xl transition-all duration-500 ease-out",
        "bg-gradient-to-br from-background to-background/50",
        "hover:scale-[1.02] hover:rotate-1 transform-gpu",
        "hover:border-primary/20 hover:bg-gradient-to-br hover:from-primary/5 hover:to-background",
      )}
    >
      <CardHeader className="p-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="p-3 relative z-10">
          <ProductImage />
        </div>
      </CardHeader>
      {!hideDetails && (
        <CardContent className="p-4 flex-1 flex flex-col justify-between relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_1px_1px,_currentColor_1px,_transparent_0)] bg-[length:20px_20px]" />
          <div className="relative z-10 flex-1 flex flex-col justify-between">
            <ProductDetails />
          </div>
          {!hideAddToCart && <AddButton />}
        </CardContent>
      )}
    </Card>
  )
}

export default ProductCard
