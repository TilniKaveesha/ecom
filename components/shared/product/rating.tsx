import React from 'react'
import { Star } from 'lucide-react'

export default function Rating({
  rating = 0,
  size = 6,
}: {
  rating: number
  size?: number
}) {
  const fullStars = Math.floor(rating)
  const partialStar = rating % 1
  const emptyStars = 5 - Math.ceil(rating)

  return (
    <div
      className='flex items-center'
      aria-label={`Rating: ${rating} out of 5 stars`}
    >
      {/* Full stars */}
      {[...Array(fullStars)].map((_, i) => (
        <Star
          key={`full-${i}`}
          className={`w-${size} h-${size} fill-[#FFC107] text-[#FFC107] drop-shadow-sm`}
        />
      ))}

      {/* Partial star */}
      {partialStar > 0 && (
        <div className='relative'>
          <Star className={`w-${size} h-${size} text-gray-300`} />
          <div
            className='absolute top-0 left-0 overflow-hidden'
            style={{ width: `${partialStar * 100}%` }}
          >
            <Star
              className={`w-${size} h-${size} fill-[#FFC107] text-[#FFC107] drop-shadow-sm`}
            />
          </div>
        </div>
      )}

      {/* Empty stars */}
      {[...Array(emptyStars)].map((_, i) => (
        <Star
          key={`empty-${i}`}
          className={`w-${size} h-${size} text-gray-300`}
        />
      ))}
    </div>
  )
}
