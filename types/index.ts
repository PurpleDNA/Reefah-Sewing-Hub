export interface Category {
  id: string
  name: string
  slug: string
  image_url?: string
}

export interface Product {
  id: string
  name: string
  slug: string
  description?: string
  price: number
  sale_price?: number
  image_url?: string
  category_id?: string
  stock: number
  featured: boolean
  categories?: Category
}

export interface CartItem {
  id: string
  name: string
  price: number
  image?: string
  quantity: number
}

export interface Review {
  id: string
  product_id: string
  user_id: string
  rating: number
  comment?: string
  created_at?: string
  profiles?: {
    full_name?: string
  }
}
