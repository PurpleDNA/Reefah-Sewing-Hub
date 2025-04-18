import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProductForm } from "@/components/admin/product-form"
import type { Product, Category } from "@/types"

export default async function EditProduct({ params }: { params: { id: string } }) {
  const supabase = createClient()

  // Fetch product data
  const { data: product } = await supabase.from("products").select("*").eq("id", params.id).single()

  if (!product) {
    notFound()
  }

  // Fetch categories for the form
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
      <ProductForm product={product as Product} categories={(categories as Category[]) || []} />
    </div>
  )
}
