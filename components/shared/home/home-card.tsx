'use client'

import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type CardItem = {
  title: string
  link: { text: string; href: string }
  items: {
    name: string
    image: string
    href: string
  }[]
}

export function HomeCard({ cards }: { cards: CardItem[] }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-8 py-10 bg-gray-50">
      {cards.map((card) => (
        <Card
          key={card.title}
          className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col"
        >
          <CardContent className="p-6 flex-1 flex flex-col">
            <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-5 tracking-tight">
              {card.title}
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {card.items.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex flex-col items-center group hover:scale-105 transition-transform duration-300"
                >
                  <div className="relative w-full aspect-square">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-contain p-2 transition-transform group-hover:scale-105 duration-500"
                    />
                  </div>
                  <p className="mt-2 text-sm text-center text-gray-700 group-hover:text-gray-900 transition-colors w-full truncate">
                    {item.name}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>

          {card.link?.href && (
            <CardFooter className="p-4 border-t border-gray-100 mt-auto">
              <Link href={card.link.href} className="w-full">
                <Button
  className="w-full bg-[#d64e2cab] text-white font-semibold uppercase tracking-wide 
             hover:bg-[#d64e2c] hover:scale-[1.02] transition-all duration-300 
             rounded-sm px-5 py-3 shadow-sm hover:shadow-md"
>
  {card.link.text}
  <span className="ml-2 text-white group-hover:translate-x-1 transition-transform duration-300">
    
  </span>
</Button>


              </Link>
            </CardFooter>
          )}
        </Card>
      ))}
    </section>
  )
}
