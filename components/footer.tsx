import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Betza Store</h3>
            <p className="text-green-100 mb-4">
              Your neighborhood grocery store, bringing fresh produce and quality products right to your doorstep.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-white hover:text-green-300">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-white hover:text-green-300">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-white hover:text-green-300">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-green-100 hover:text-white">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=fruits-vegetables" className="text-green-100 hover:text-white">
                  Fruits & Vegetables
                </Link>
              </li>
              <li>
                <Link href="/products?category=dairy-eggs" className="text-green-100 hover:text-white">
                  Dairy & Eggs
                </Link>
              </li>
              <li>
                <Link href="/products?category=bakery" className="text-green-100 hover:text-white">
                  Bakery
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-green-100 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-green-100 hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-100 hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-100 hover:text-white">
                  Blog
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Help</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-green-100 hover:text-white">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-100 hover:text-white">
                  Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-100 hover:text-white">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-100 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-green-800 mt-8 pt-8 text-center text-green-100">
          <p>&copy; {new Date().getFullYear()} Betza Store. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
