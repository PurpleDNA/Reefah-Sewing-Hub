"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Truck, BadgeCheck, Layers } from "lucide-react"
import { motion } from "framer-motion"

const categories = [
  { label: "Beads", note: "Pearls, crystal, glass & more", emoji: "📿" },
  { label: "Stones", note: "Rhinestones, flatbacks & more", emoji: "💎" },
  { label: "Trimming", note: "Laces, ribbons, braids & more", emoji: "🎀" },
  { label: "Threads", note: "All colours & types", emoji: "🧵" },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

export function Hero() {
  return (
    <section className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 lg:gap-16 items-center py-10 md:py-16">
        {/* Left: editorial copy */}
        <motion.div variants={container} initial="hidden" animate="show" className="text-center lg:text-left">
          <motion.span
            variants={item}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-green-600/30 bg-green-50 text-green-700 text-sm font-medium"
          >
            <Sparkles className="h-4 w-4" />
            Your One-Stop Sewing Shop
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-5xl md:text-6xl lg:text-7xl font-semibold leading-[0.95] tracking-tight text-orange-900"
          >
            Every detail makes a
            <span className="block text-green-600 italic">beautiful creation.</span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0"
          >
            Beads, stones, trimming, threads, accessories &amp; sewing tools that bring your designs to life —
            everything tailors, designers &amp; DIY lovers need, under one roof.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-base h-12 px-7 rounded-full shadow-lg shadow-green-600/20">
              <Link href="/products">
                Shop Now <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base h-12 px-7 rounded-full border-orange-900/20 text-orange-900 hover:bg-orange-900 hover:text-white"
            >
              <Link href="/about">Our Story</Link>
            </Button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            variants={item}
            className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-sm text-orange-900/70"
          >
            <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-green-600" /> Wholesale &amp; Retail</span>
            <span className="hidden sm:block stitch-v h-4" />
            <span className="flex items-center gap-2"><Layers className="h-4 w-4 text-green-600" /> Bulk Orders Accepted</span>
            <span className="hidden sm:block stitch-v h-4" />
            <span className="flex items-center gap-2"><Truck className="h-4 w-4 text-green-600" /> Fast Delivery</span>
          </motion.div>
        </motion.div>

        {/* Right: composed category showcase on a navy panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          className="relative"
        >
          <div className="relative rounded-[2rem] bg-orange-900 p-6 md:p-8 shadow-2xl shadow-orange-900/30 overflow-hidden">
            {/* glow */}
            <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-green-500/30 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-green-600/20 blur-3xl" />

            <div className="relative flex items-center justify-between mb-6">
              <div>
                <p className="text-green-300 text-xs font-semibold uppercase tracking-[0.2em]">We Stock</p>
                <p className="text-white/70 text-sm mt-1">Everything you need to create</p>
              </div>
              <span className="text-4xl font-display font-semibold text-white leading-none">
                R<span className="text-green-500">.</span>
              </span>
            </div>

            <div className="relative grid grid-cols-2 gap-4">
              {categories.map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 + i * 0.1 }}
                  className="group rounded-2xl bg-white/95 p-5 hover:-translate-y-1 transition-transform"
                >
                  <span className="text-3xl">{c.emoji}</span>
                  <p className="mt-3 font-display text-lg font-semibold text-orange-900">{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.note}</p>
                </motion.div>
              ))}
            </div>

            <div className="relative mt-6 flex items-center justify-between rounded-2xl bg-green-600 px-5 py-4">
              <p className="text-white font-medium leading-tight">
                Beads, stones &amp; trimming<br />
                <span className="text-white/80 text-sm font-normal">that bring your designs to life</span>
              </p>
              <Link
                href="/products"
                className="shrink-0 grid place-items-center h-11 w-11 rounded-full bg-white text-green-700 hover:scale-105 transition-transform"
                aria-label="Browse products"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          {/* Floating accent badge */}
          <div className="absolute -bottom-5 -left-4 md:-left-6 bg-white rounded-2xl shadow-xl px-5 py-3 flex items-center gap-3 border border-orange-900/5">
            <span className="text-2xl">✂️</span>
            <div className="leading-tight">
              <p className="font-display font-semibold text-orange-900">Under One Roof</p>
              <p className="text-xs text-muted-foreground">Accessories &amp; more</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stitch divider */}
      <div className="stitch opacity-40 my-6" />
    </section>
  )
}
