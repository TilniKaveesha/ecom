import Image from 'next/image'
import Link from 'next/link'
import { getAllCategories } from '@/lib/actions/product.actions'
import { getSetting } from '@/lib/actions/setting.actions'
import { getTranslations } from 'next-intl/server'
import Menu from './menu'
import Search from './search' // Make sure this supports open + setOpen props
import Sidebar from './sidebar'
import data from '@/lib/data'

export default async function Header() {
  const categories = await getAllCategories()
  const { site } = await getSetting()
  const t = await getTranslations()

  // Can't use useState here directly since it's a server component,
  // But you can lift the Search toggle state into Search component (client component).
  // If necessary, move the Search logic to a client wrapper.
  return (
    <header className="bg-white text-black shadow-sm border-b border-gray-200 z-40 relative">
      <div className="max-w-full mx-auto px-1.5">
        <div className="flex items-center justify-between h-16 relative">
          {/* Left side (mobile menu) */}
          <div className="flex-1 md:hidden">
          </div>
          <div className="flex-1 hidden md:block" />

          {/* Center logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-xl"
              aria-label="Home"
            >
              <Image
                src={site.logo}
                width={36}
                height={36}
                alt={`${site.name} logo`}
                priority
              />
              <span className="hidden sm:inline">{site.name}</span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4 justify-end min-w-[200px]">
            <Search />
            <Menu />
          </div>
        </div>

        {/* Category bar */}
        <nav className="bg-gray-100 border-t border-gray-200 py-2">
          <div className="flex items-center overflow-x-auto scrollbar-hide py-2">
            <div className="flex items-center gap-1 px-2">
              {data.headerMenus.map((menu) => (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className="text-sm font-medium text-gray-700 hover:text-black px-3 py-1 rounded-md hover:bg-gray-200 whitespace-nowrap transition-colors"
                >
                  {t('Header.' + menu.name)}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Sidebar category list (optional for mobile or full menu) */}
        <div className="hidden">
          <Sidebar categories={categories} />
        </div>
      </div>
    </header>
  )
}
