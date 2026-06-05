import { createClient } from "@/lib/supabase/server"
import { ProductGrid } from "@/components/product-grid"
import { CategoryFilter } from "@/components/category-filter"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Products - REEFA SEWING HUB",
  description: "Browse our wide selection of products",
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const { category, search } = await searchParams

  const supabase = await createClient()

  // Fetch categories for filter
  const { data: categories } = await supabase.from("categories").select("*")

  // Build query for products
  let query = supabase.from("products").select("*, categories(name, slug)")

  // Apply category filter if provided
  if (category) {
    query = query.eq("categories.slug", category)
  }

  // Apply search filter if provided
  if (search) {
    query = query.ilike("name", `%${search}%`)
  }

  // Execute query
  const { data: products } = await query

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">All Products</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <CategoryFilter
            categories={categories || []}
            selectedCategory={category}
          />
        </div>

        <div className="md:col-span-3">
          {search && (
            <p className="mb-4 text-muted-foreground">
              Search results for:{" "}
              <span className="font-medium text-foreground">{search}</span>
            </p>
          )}
          <ProductGrid products={products || []} />
        </div>
      </div>
    </div>
  )
}
