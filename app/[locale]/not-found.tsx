'use client'
import React from 'react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4'>
      <div className='p-8 bg-white rounded-xl shadow-lg w-full max-w-md border border-gray-200 text-center'>
        {/* Added visual element (unchanged functionality) */}
        <div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4'>
          <svg 
            className="h-6 w-6 text-red-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </div>
        
        {/* Original text with enhanced styling */}
        <h1 className='text-2xl font-bold text-gray-800 mb-3'>Not Found</h1>
        <p className='text-red-500 mb-6'>Could not find requested resource</p>
        
        {/* Original button with better visual hierarchy */}
        <Button
          variant='outline'
          className='mt-4 px-6 py-3 border-gray-300 hover:bg-gray-50 transition-colors'
          onClick={() => (window.location.href = '/')}
        >
          Back to home
        </Button>
      </div>
    </div>
  )
}