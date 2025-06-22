import { Button } from '@/components/ui/button'
import { IProduct } from '@/lib/db/models/product.model'
import Link from 'next/link'
import { Check } from 'lucide-react'

export default function SelectVariant({
  product,
  color,
  size,
}: {
  product: IProduct
  color: string
  size: string
}) {
  const selectedColor = color || product.colors[0]
  const selectedSize = size || product.sizes[0]

  return (
    <>
      {product.colors.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium">Color:</div>
          <div className="flex flex-wrap gap-2">
            {product.colors.map((x: string) => {
              const isSelected = selectedColor === x
              return (
                <Button
                  asChild
                  key={x}
                  variant="outline"
                  className={`relative p-1.5 rounded-full border-2 transition-all ${
                    isSelected ? 'border-yellow-400 ring-2 ring-yellow-400' : ''
                  }`}
                >
                  <Link
                    replace
                    scroll={false}
                    href={`?${new URLSearchParams({
                      color: x,
                      size: selectedSize,
                    })}`}
                  >
                    <div
                      className="h-6 w-6 rounded-full border border-muted-foreground"
                      style={{ backgroundColor: x }}
                    >
                      {isSelected && (
                        <Check className="text-white w-3 h-3 m-auto mt-[3px]" />
                      )}
                    </div>
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {product.sizes.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="font-medium">Size:</div>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((x: string) => {
              const isSelected = selectedSize === x
              return (
                <Button
                  asChild
                  key={x}
                  variant={isSelected ? 'default' : 'outline'}
                  className={`min-w-[2.5rem] justify-center ${
                    isSelected ? 'bg-yellow-400 text-black border-yellow-400' : ''
                  }`}
                >
                  <Link
                    replace
                    scroll={false}
                    href={`?${new URLSearchParams({
                      color: selectedColor,
                      size: x,
                    })}`}
                  >
                    {x}
                  </Link>
                </Button>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
