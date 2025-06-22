import SearchClient from "./search-client"
import { getSetting } from "@/lib/actions/setting.actions"
import { getAllCategories } from "@/lib/actions/product.actions"
import { getTranslations } from "next-intl/server"

export default async function Search() {
  const {
    site: { name },
  } = await getSetting()
  const categories = await getAllCategories()
  const t = await getTranslations()

  return (
    <SearchClient
      siteName={name}
      categories={categories}
      translations={{
        all: t("Header.All"),
        placeholder: t("Header.Search Site", { name }),
      }}
    />
  )
}
