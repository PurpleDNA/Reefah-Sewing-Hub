import Link from "next/link"
import { Facebook, Instagram, Phone, Mail, MapPin } from "lucide-react"
import { getStoreSettings } from "@/lib/settings"

export default async function Footer() {
  const settings = await getStoreSettings()
  const telHref = `tel:${settings.store_phone.replace(/\s+/g, "")}`

  return (
    <footer className="relative bg-orange-950 text-white mt-16">
      {/* stitch accent across the top */}
      <div className="stitch opacity-70" />

      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid place-items-center h-10 w-10 rounded-xl bg-green-600 text-white font-display text-2xl font-semibold leading-none">
                R
              </span>
              <span className="flex flex-col leading-none">
                <span className="font-display text-xl font-semibold tracking-tight">Reefa</span>
                <span className="text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-green-400">
                  Sewing Hub
                </span>
              </span>
            </Link>
            <p className="text-white/60 mt-4 text-sm leading-relaxed">
              {settings.store_description}
            </p>
            <div className="flex space-x-3 mt-5">
              <a href={settings.facebook_url || "#"} target="_blank" rel="noopener noreferrer" className="grid place-items-center h-9 w-9 rounded-full bg-white/10 hover:bg-green-600 transition-colors" aria-label="Facebook">
                <Facebook className="h-4 w-4" />
              </a>
              <a href={settings.instagram_url || "#"} target="_blank" rel="noopener noreferrer" className="grid place-items-center h-9 w-9 rounded-full bg-white/10 hover:bg-green-600 transition-colors" aria-label="Instagram">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h3 className="font-display text-base font-semibold mb-4 text-green-400">Shop</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/products" className="text-white/70 hover:text-white transition-colors">All Products</Link></li>
              <li><Link href="/about" className="text-white/70 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="font-display text-base font-semibold mb-4 text-green-400">Customer Service</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Help &amp; FAQ</Link></li>
              <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Shipping Information</Link></li>
              <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Returns &amp; Exchanges</Link></li>
              <li><Link href="/contact" className="text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display text-base font-semibold mb-4 text-green-400">Contact Us</h3>
            <ul className="space-y-3 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <MapPin className="h-4 w-4 mt-0.5 text-green-400 shrink-0" />
                <span>{settings.store_address}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-green-400 shrink-0" />
                <a href={telHref} className="hover:text-white transition-colors">{settings.store_phone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-green-400 shrink-0" />
                <a href={`mailto:${settings.store_email}`} className="hover:text-white transition-colors break-all">
                  {settings.store_email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center text-white/50 text-sm">
          <p>&copy; {new Date().getFullYear()} Reefa Sewing Hub. All rights reserved.</p>
          <p className="italic font-display text-white/60">Every detail makes a beautiful creation.</p>
        </div>
      </div>
    </footer>
  )
}
