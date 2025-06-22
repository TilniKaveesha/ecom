import { MenuIcon } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import CartButton from './cart-button'
import UserButton from './user-button'
//import ThemeSwitcher from './theme-switcher'
import LanguageSwitcher from './language-switcher'
import { useTranslations } from 'next-intl'

const Menu = ({ forAdmin = false }: { forAdmin?: boolean }) => {
  const t = useTranslations()
  return (
    <div className='flex justify-end text-sm font-small'>
      {/* Desktop menu: flex + justify-end pushes items to right */}
      <nav className='hidden md:flex gap-3 justify-end w-full'>
        <LanguageSwitcher />
        {/*<ThemeSwitcher />*/}
        <UserButton />
        {forAdmin ? null : <CartButton />}
      </nav>

      {/* Mobile menu */}
      <nav className='md:hidden'>
        <Sheet>
          <SheetTrigger className='align-middle header-button'>
            <MenuIcon className='h-6 w-6' />
          </SheetTrigger>

          {/* flex-col + items-end for vertical right alignment */}
          <SheetContent className='bg-black text-white flex flex-col items-end space-y-4'>
            <SheetHeader className='w-full'>
              <div className='flex items-center justify-between'>
                <SheetTitle>{t('Header.Site Menu')}</SheetTitle>
                <SheetDescription></SheetDescription>
              </div>
            </SheetHeader>

            <LanguageSwitcher />
            {/*<ThemeSwitcher />*/}
            <UserButton />
            <CartButton />
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  )
}

export default Menu
