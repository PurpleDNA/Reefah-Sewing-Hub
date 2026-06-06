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

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  is_read: boolean
  created_at: string
}

export interface AboutValue {
  title: string
  description: string
}

export interface StoreSettings {
  store_name: string
  store_email: string
  store_phone: string
  store_address: string
  store_description: string
  enable_reviews: boolean
  enable_guest_checkout: boolean
  facebook_url: string
  instagram_url: string
  about_story: string
  about_mission: string
  about_values: AboutValue[]
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
