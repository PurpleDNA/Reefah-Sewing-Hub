import { Hero } from "@/components/hero"
import { FeaturedProducts } from "@/components/featured-products"
import { CategoryGrid } from "@/components/category-grid"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createClient()

  // Fetch featured products
  const { data: featuredProducts } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("featured", true)
    .limit(4)

  // Fetch all categories
  const { data: categories } = await supabase.from("categories").select("*")

  return (
    <div className="container mx-auto px-4 py-8">
      <Hero />
      <FeaturedProducts products={featuredProducts || []} />
      <CategoryGrid categories={categories || []} />
    </div>
  )
}
