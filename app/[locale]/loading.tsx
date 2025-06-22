import { getTranslations } from 'next-intl/server'

export default async function LoadingPage() {
  const t = await getTranslations()
  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-50'>
      <div className='p-8 rounded-xl shadow-lg w-full max-w-md bg-white text-center border border-gray-100'>
        <div className='flex justify-center mb-6'>
          {/* Animated shopping bag icon */}
          <div className='relative w-16 h-16'>
            <div className='absolute inset-0 bg-blue-100 rounded-full animate-pulse'></div>
            <svg 
              className='absolute inset-0 m-auto text-blue-600' 
              xmlns="http://www.w3.org/2000/svg" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
          </div>
        </div>
        
        <h3 className='text-lg font-medium text-gray-800 mb-2'>
          {t('Loading.Loading')}
        </h3>
        <p className='text-gray-500 mb-6'>
          Preparing your shopping experience...
        </p>
        
        {/* Animated loading bar */}
        <div className='w-full bg-gray-200 rounded-full h-2.5'>
          <div className='bg-blue-600 h-2.5 rounded-full animate-pulse' style={{width: '45%'}}></div>
        </div>
        
        {/* Fixed fallback text without using t() */}
        <div className='mt-6 text-sm text-gray-400 animate-pulse'>
          Please wait...
        </div>
      </div>
    </div>
  )
}