import { createClient } from "@/lib/supabase/server"
import { ProductDetail } from "@/components/product-detail"
import { Reviews } from "@/components/reviews"
import { notFound } from "next/navigation"

export default async function ProductPage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient()

  // Fetch product details
  const { data: product } = await supabase
    .from("products")
    .select("*, categories(name, slug)")
    .eq("slug", params.slug)
    .single()

  if (!product) {
    notFound()
  }

  // Fetch product reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("*, profiles:user_id(full_name)")
    .eq("product_id", product.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <ProductDetail product={product} />
      <Reviews productId={product.id} reviews={reviews || []} />
    </div>
  )
}
