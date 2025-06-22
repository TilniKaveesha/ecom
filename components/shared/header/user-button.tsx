import { auth } from '@/auth'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOut } from '@/lib/actions/user.actions'
import { cn } from '@/lib/utils'
import { ChevronDownIcon, UserCircle2Icon } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

export default async function UserButton() {
  const t = await getTranslations()
  const session = await auth()
  
  return (
    <div className="flex items-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <div className="hidden sm:flex flex-col items-start text-sm leading-tight">
              <span className="text-gray-500 dark:text-gray-400">
                {t('Header.Hello')}, {session ? session.user.name : t('Header.sign in')}
              </span>
              <span className="font-medium text-gray-900 dark:text-white">
                {t('Header.Account & Orders')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <UserCircle2Icon className="h-5 w-5 text-gray-700 dark:text-gray-300" />
              <ChevronDownIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
          </button>
        </DropdownMenuTrigger>

        {session ? (
          <DropdownMenuContent 
            className="w-64 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700" 
            align="end" 
            forceMount
          >
            <DropdownMenuLabel className="font-normal px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session.user.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuGroup className="py-1">
              <Link href="/account" className="w-full">
                <DropdownMenuItem className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('Header.Your account')}
                  </span>
                </DropdownMenuItem>
              </Link>
              <Link href="/account/orders" className="w-full">
                <DropdownMenuItem className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {t('Header.Your orders')}
                  </span>
                </DropdownMenuItem>
              </Link>
              {session.user.role === 'Admin' && (
                <Link href="/admin/overview" className="w-full">
                  <DropdownMenuItem className="px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {t('Header.Admin')}
                    </span>
                  </DropdownMenuItem>
                </Link>
              )}
            </DropdownMenuGroup>

            <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700">
              <form action={SignOut} className="w-full">
                <Button
                  className="w-full justify-start text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                  variant="ghost"
                  size="sm"
                >
                  {t('Header.Sign out')}
                </Button>
              </form>
            </div>
          </DropdownMenuContent>
        ) : (
          <DropdownMenuContent 
            className="w-64 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700" 
            align="end" 
            forceMount
          >
            <DropdownMenuGroup className="p-2">
              <DropdownMenuItem className="p-1">
                <Link
                  href="/sign-in"
                  className={cn(
                    buttonVariants({ variant: 'default' }),
                    'w-full text-sm py-2 bg-yellow-50 text-black hover:bg-yellow-400'
                  )}
                >
                  {t('Header.Sign in')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuLabel className="text-center text-sm font-normal px-4 pb-3 pt-1 text-gray-600 dark:text-gray-400">
              {t('Header.New Customer')}?{' '}
              <Link 
                href="/sign-up" 
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {t('Header.Sign up')}
              </Link>
            </DropdownMenuLabel>
          </DropdownMenuContent>
        )}
      </DropdownMenu>
    </div>
  )
}