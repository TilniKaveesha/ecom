'use client'

import { useState } from "react"
import { SearchIcon, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Props {
  siteName: string
  categories: string[]
  translations: {
    all: string
    placeholder: string
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SearchClient({ siteName, categories, translations }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Toggle Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="relative text-tk-dark p-3 hover:bg-tk-light rounded-xl transition-all duration-300 group hover:scale-105 hover:shadow-lg"
        >
          <SearchIcon className="w-5 h-5 transition-transform group-hover:scale-110" />
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/10 group-hover:to-purple-500/10 transition-all duration-300" />
        </button>
      )}

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] animate-in fade-in duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Full Search UI */}
      {open && (
        <div className="fixed top-0 left-0 w-full bg-white/95 backdrop-blur-xl z-[1000] shadow-2xl border-b border-gray-200/50 animate-in slide-in-from-top duration-500 ease-out">
          <div className="max-w-5xl mx-auto px-4 py-6">
            <form action="/search" method="GET" className="flex items-stretch gap-3">
              <Select name="category">
                <SelectTrigger className="w-36 h-14 bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200/60 rounded-2xl text-black shadow-sm hover:shadow-md hover:border-gray-300/80 transition-all duration-300 hover:scale-[1.02]">
                  <SelectValue placeholder={translations.all} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200/60 shadow-xl">
                  <SelectItem value="all" className="rounded-lg">{translations.all}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} className="rounded-lg capitalize">
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex-1 relative group">
                <Input
                  name="q"
                  placeholder={translations.placeholder}
                  className="flex-1 h-14 bg-gradient-to-br from-gray-50 to-gray-100 text-black border-2 border-gray-200/60 rounded-2xl px-6 text-lg placeholder:text-gray-400 shadow-sm hover:shadow-md focus:shadow-lg hover:border-gray-300/80 focus:border-blue-400/80 focus:bg-white transition-all duration-300 hover:scale-[1.01] focus:scale-[1.01]"
                  autoFocus
                />
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 to-purple-500/0 group-focus-within:from-blue-500/5 group-focus-within:to-purple-500/5 transition-all duration-300 pointer-events-none" />
              </div>

              <button
                type="submit"
                className="relative bg-gradient-to-r from-gray-900 to-black text-white px-6 h-14 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <SearchIcon className="w-6 h-6 relative z-10 transition-transform group-hover:scale-110" />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-gray-500 hover:text-gray-700 px-3 hover:bg-gray-100 rounded-2xl transition-all duration-300 hover:scale-105 group"
              >
                <X className="w-6 h-6 transition-transform group-hover:rotate-90" />
              </button>
            </form>
            <div className="mt-4 h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent rounded-full" />
            <div className="mt-1 h-0.5 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent rounded-full animate-pulse" />
          </div>
        </div>
      )}
    </>
  )
}
