'use client'

import { useEffect, useState } from 'react'
import { ChevronUp, Facebook, Twitter, Instagram } from 'lucide-react'
import { Button } from '../ui/button'
import Link from 'next/link'
import { APP_NAME } from '@/lib/constants'

interface FooterData {
  email?: string
  phone?: string
  address?: string
}

export default function Footer() {
  const [data, setData] = useState<FooterData>({})

  useEffect(() => {
    async function fetchFooterData() {
      try {
        const res = await fetch('/api/settings/footer')
        const json = await res.json()
        setData(json)
      } catch (err) {
        console.error('Failed to fetch footer info:', err)
      }
    }

    fetchFooterData()
  }, [])

  return (
    <>
      {/* Floating Back to Top Button */}
      <Button
        variant="default"
        className="fixed bottom-6 right-6 bg-gray-800 hover:bg-gray-700 text-white rounded-full w-12 h-12 p-0 shadow-md z-50"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>

      {/* Footer */}
      <footer className="bg-[#f5f5f3] text-gray-700 text-sm border-t border-gray-300 mt-16">
        <div className="px-6 md:px-12 py-10 max-w-screen-xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Info Links */}
            <div>
              <h3 className="text-gray-900 text-base font-semibold mb-3">Information</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/page/conditions-of-use" className="hover:text-gray-900 hover:underline">
                    Conditions of Use
                  </Link>
                </li>
                <li>
                  <Link href="/page/privacy-policy" className="hover:text-gray-900 hover:underline">
                    Privacy Notice
                  </Link>
                </li>
                <li>
                  <Link href="/page/help" className="hover:text-gray-900 hover:underline">
                    Help
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="text-gray-900 text-base font-semibold mb-3">Contact</h3>
              <address className="not-italic space-y-2 text-gray-700">
                <p>{data.address || 'Loading address...'}</p>
                <p>
                  Phone:{' '}
                  <a href={`tel:${data.phone}`} className="hover:text-gray-900 hover:underline">
                    {data.phone || 'Loading...'}
                  </a>
                </p>
                <p>
                  Email:{' '}
                  <a href={`mailto:${data.email}`} className="hover:text-gray-900 hover:underline">
                    {data.email || 'Loading...'}
                  </a>
                </p>
              </address>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-gray-900 text-base font-semibold mb-3">Follow Us</h3>
              <div className="flex space-x-4">
                <Link href="https://facebook.com" aria-label="Facebook">
                  <Facebook className="w-5 h-5 stroke-gray-600 hover:stroke-gray-900 transition" />
                </Link>
                <Link href="https://twitter.com" aria-label="Twitter">
                  <Twitter className="w-5 h-5 stroke-gray-600 hover:stroke-gray-900 transition" />
                </Link>
                <Link href="https://instagram.com" aria-label="Instagram">
                  <Instagram className="w-5 h-5 stroke-gray-600 hover:stroke-gray-900 transition" />
                </Link>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-300 mt-10 pt-4 text-center text-gray-500 text-xs select-none">
            © 2025, {APP_NAME}, Inc. or its affiliates
          </div>
        </div>
      </footer>
    </>
  )
}
