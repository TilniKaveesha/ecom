/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import useCartStore from '@/hooks/use-cart-store'
import { useToast } from '@/hooks/use-toast'
import { OrderItem } from '@/types'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ShoppingCart, Zap } from 'lucide-react'

export default function AddToCart({
  item,
  minimal = false,
}: {
  item: OrderItem
  minimal?: boolean
}) {
  const router = useRouter()
  const { toast } = useToast()

  const { addItem } = useCartStore()

  //PROMPT: add quantity state
  const [quantity, setQuantity] = useState(1)

  const t = useTranslations()

    const handleAddToCart = () => {
    try {
      addItem(item, quantity)
      toast({
        description: t('Added to Cart'),
        action: (
          <Button
            variant="secondary"
            className="ml-2"
            onClick={() => router.push('/cart')}
          >
            View Cart
          </Button>
        ),
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message,
      })
    }
  }

  const handleBuyNow = () => {
    try {
      addItem(item, quantity)
      router.push('/checkout')
    } catch (error: any) {
      toast({
        variant: 'destructive',
        description: error.message,
      })
    }
  }


  return minimal ? (
    <Button
      className="rounded-full w-auto px-6 gap-2"
      onClick={handleAddToCart}
    >
      <ShoppingCart className="h-4 w-4" />
      Add to Cart
    </Button>
  ) : (
    <div className="w-full space-y-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">Quantity:</span>
        <Select
          value={quantity.toString()}
          onValueChange={(i) => setQuantity(Number(i))}
        >
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: item.countInStock }).map((_, i) => (
              <SelectItem key={i + 1} value={`${i + 1}`}>
                {i + 1}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          className="rounded-lg h-12 gap-2 hover:shadow-md transition-shadow"
          onClick={async () => {
          try {
            const itemId = await addItem(item, quantity)
            router.push(`/cart/${itemId}`)
          } catch (error: any) {
            toast({
              variant: 'destructive',
              description: error.message,
            })
          }
        }}
        >
          <ShoppingCart className="h-4 w-4" />
          Add to Cart
        </Button>
        
        <Button
          variant="default"
          className="rounded-lg h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 hover:shadow-md transition-shadow"
          onClick={handleBuyNow}
        >
          <Zap className="h-4 w-4" />
          Buy Now
        </Button>
      </div>

      {item.countInStock < 10 && (
        <div className="text-xs text-amber-600 mt-1">
          Only {item.countInStock} left in stock!
        </div>
      )}
    </div>
  )
}
