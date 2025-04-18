"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { Category } from "@/types"
import { cn } from "@/lib/utils"

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory?: string
}

export function CategoryFilter({ categories, selectedCategory }: CategoryFilterProps) {
  const pathname = usePathname()

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Categories</h3>
      <div className="space-y-2">
        <Link
          href="/products"
          className={cn(
            "block px-3 py-2 rounded-md text-sm transition-colors",
            !selectedCategory ? "bg-green-100 text-green-800 font-medium" : "hover:bg-gray-100",
          )}
        >
          All Products
        </Link>

        {categories.map((category) => (
          <Link
            key={category.id}
            href={`${pathname}?category=${category.slug}`}
            className={cn(
              "block px-3 py-2 rounded-md text-sm transition-colors",
              selectedCategory === category.slug ? "bg-green-100 text-green-800 font-medium" : "hover:bg-gray-100",
            )}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
