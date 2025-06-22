'use client'

import useSettingStore from '@/hooks/use-setting-store'
import { cn, round2 } from '@/lib/utils'
import { useFormatter, useTranslations } from 'next-intl'

const ProductPrice = ({
  price,
  className,
  listPrice = 0,
  isDeal = false,
  forListing = true,
  plain = false,
}: {
  price: number
  isDeal?: boolean
  listPrice?: number
  className?: string
  forListing?: boolean
  plain?: boolean
}) => {
  const { getCurrency } = useSettingStore()
  const currency = getCurrency()
  const format = useFormatter()
  const t = useTranslations()

  const convertedPrice = round2(price * currency.convertRate)
  const convertedListPrice = round2(listPrice * currency.convertRate)
  const discountPercent = convertedListPrice > 0
    ? Math.round(100 - (convertedPrice / convertedListPrice) * 100)
    : 0

  const stringValue = convertedPrice.toFixed(2)
  const [intValue, floatValue] = stringValue.split('.')
  const showDiscount = convertedListPrice > convertedPrice

  if (plain) {
    return format.number(convertedPrice, {
      style: 'currency',
      currency: currency.code,
      currencyDisplay: 'narrowSymbol',
    })
  }

  return (
    <div className={cn('w-full', className)}>
      {showDiscount && isDeal && (
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-md font-medium">
            {discountPercent}% {t('Product.Off')}
          </span>
          <span className="text-red-700 text-sm font-semibold">
            {t('Product.Limited time deal')}
          </span>
        </div>
      )}

      <div
        className={cn(
          'flex items-baseline gap-3',
          forListing ? 'justify-center' : 'justify-start'
        )}
      >
        {showDiscount && !isDeal && (
          <div className="text-orange-600 font-bold text-lg sm:text-xl -ml-1">
            -{discountPercent}%
          </div>
        )}

        <div className="text-2xl sm:text-3xl font-semibold text-gray-900">
          <span className="text-sm align-super">{currency.symbol}</span>
          {intValue}
          <span className="text-sm align-super">.{floatValue}</span>
        </div>

        {showDiscount && (
          <div className="text-gray-500 text-xs sm:text-sm line-through">
            {format.number(convertedListPrice, {
              style: 'currency',
              currency: currency.code,
              currencyDisplay: 'narrowSymbol',
            })}
          </div>
        )}
      </div>

      {showDiscount && !isDeal && (
        <p className="text-gray-400 text-xs mt-1 ml-[2px]">
          {t('Product.List price')}
        </p>
      )}
    </div>
  )
}

export default ProductPrice
