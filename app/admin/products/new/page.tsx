import { createClient } from "@/lib/supabase/server"
import { ProductForm } from "@/components/admin/product-form"
import type { Category } from "@/types"

export default async function NewProduct() {
  const supabase = await createClient()

  // Fetch categories for the form
  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Add New Product</h1>
      <ProductForm categories={(categories as Category[]) || []} />
    </div>
  )
}
