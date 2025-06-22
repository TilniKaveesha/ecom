import BrowsingHistoryList from '@/components/shared/browsing-history-list'
import { HomeCard } from '@/components/shared/home/home-card'
import { HomeCarousel } from '@/components/shared/home/home-carousel'
import ProductSlider from '@/components/shared/product/product-slider'
import { Card, CardContent } from '@/components/ui/card'
import {
  getAllCategories,
  getProductsByTag,
  getProductsForCard,
} from '@/lib/actions/product.actions'
import data from '@/lib/data'
import { toSlug } from '@/lib/utils'

export default async function HomePage() {
  const [
    todaysDeals,
    categoriesRaw,
    newArrivals,
    featureds,
    bestSellers,
  ] = await Promise.all([
    getProductsByTag({ tag: 'todays-deal' }),
    getAllCategories(),
    getProductsForCard({ tag: 'new-arrival', limit: 4 }),
    getProductsForCard({ tag: 'featured', limit: 4 }),
    getProductsForCard({ tag: 'best-seller', limit: 4 }),
  ])

  const categories = categoriesRaw.slice(0, 4)

  const bestSellingProducts = await getProductsByTag({ tag: 'best-seller' })
  const cards = [
    {
      title: 'Categories to Explore',
      link: { text: 'See More', href: '/search' },
      items: categories.map((category) => ({
        name: category,
        image: `/images/${toSlug(category)}.jpg`,
        href: `/search?category=${category}`,
      })),
    },
    {
      title: 'Explore New Arrivals',
      link: { text: 'View All', href: '/search?tag=new-arrival' },
      items: newArrivals,
    },
    {
      title: 'Discover Best Sellers',
      link: { text: 'View All', href: '/search?tag=best-seller' },
      items: bestSellers,
    },
    {
      title: 'Featured Products',
      link: { text: 'Shop Now', href: '/search?tag=featured' },
      items: featureds,
    },
  ]

  return (
    <>
      <HomeCarousel items={data.carousels} />

      <div className="bg-border md:p-4 md:space-y-6 space-y-4">
        <HomeCard cards={cards} />

        {todaysDeals?.length > 0 && (
          <Card className="w-full rounded-none">
            <CardContent className="p-4 sm:p-6">
              <ProductSlider title="Today's Deals" products={todaysDeals} />
            </CardContent>
          </Card>
        )}
        {bestSellingProducts?.length > 0 && (
          <Card className="w-full rounded-none">
            <CardContent className="p-4 sm:p-6">

              <ProductSlider
            title='Best Selling Products'
              products={bestSellingProducts}
            hideDetails
              />
            </CardContent>
          </Card>
        )}
        <div className='p-4 bg-background'>
        <BrowsingHistoryList/>
        </div>
        
      </div>
    </>
  )
}
