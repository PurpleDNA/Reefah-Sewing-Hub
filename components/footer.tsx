import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export default function Footer() {
  return (
    <footer className="bg-green-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">REEFA SEWING HUB</h3>
            <p className="text-green-100 mb-4">
              Your one-stop sewing shop for fabrics, tailoring, and everything you need to create.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-white hover:text-green-300">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="#" className="text-white hover:text-green-300">
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="#" className="text-white hover:text-green-300">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </a>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="text-green-100 hover:text-white">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-green-100 hover:text-white">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-green-100 hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="text-green-100 hover:text-white">
                  Help & FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-green-100 hover:text-white">
                  Shipping Information
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-green-100 hover:text-white">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-green-100 hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <address className="not-italic text-green-100">
              <p>Address: TBD</p>
              <p className="mt-2">Phone: +233 24 657 0570</p>
              <p>Email: contact@reefasewinghub.com</p>
            </address>
          </div>
        </div>
        <div className="border-t border-green-800 mt-8 pt-8 text-center text-green-100">
          <p>&copy; {new Date().getFullYear()} REEFA SEWING HUB. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
