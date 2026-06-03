import { createClient } from "@/lib/supabase/server"
import { CategoriesManager } from "@/components/admin/categories-manager"
import type { Category } from "@/types"

export default async function AdminCategories() {
  const supabase = await createClient()

  const { data: categories } = await supabase.from("categories").select("*").order("name")

  return <CategoriesManager initialCategories={(categories as Category[]) || []} />
}
