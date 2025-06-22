import { getSetting } from '@/lib/actions/setting.actions'
import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { site } = await getSetting()
  return (
    <div className='flex flex-col items-center min-h-screen bg-gray-50'>
      <header className='mt-12 mb-8'>
        <Link href='/' className='block hover:opacity-90 transition-opacity'>
          <Image
            src='/icons/logo.svg'
            alt='logo'
            width={80}
            height={80}
            priority
            className='object-contain'
          />
        </Link>
      </header>
      
      <main className='mx-auto w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8'>
        {children}
      </main>
      
      <footer className='w-full bg-[#f5f5f3] text-gray-900 py-8 mt-auto'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-center items-center gap-6 mb-6'>
            <Link 
              href='/page/conditions-of-use' 
              className='hover:text-white transition-colors'
            >
              Conditions of Use
            </Link>
            <div className='h-4 w-px bg-gray-600 hidden md:block'></div>
            <Link 
              href='/page/privacy-policy' 
              className='hover:text-white transition-colors'
            >
              Privacy Notice
            </Link>
            <div className='h-4 w-px bg-gray-600 hidden md:block'></div>
            <Link 
              href='/page/help' 
              className='hover:text-white transition-colors'
            >
              Help
            </Link>
          </div>
          <div className='text-center'>
            <p className='text-gray-400 text-sm'>{site.copyright}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}