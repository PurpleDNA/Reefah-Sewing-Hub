import { createClient } from "@/lib/supabase/server"
import type { StoreSettings } from "@/types"

// Mirrors the seed row in sql/store-settings.sql. Used as a fallback so the
// public site still renders if the settings row is missing or the query fails.
export const DEFAULT_SETTINGS: StoreSettings = {
  store_name: "REEFA SEWING HUB",
  store_email: "contact@reefasewinghub.com",
  store_phone: "+233 24 657 0570",
  store_address: "TBD, Ghana",
  store_description:
    "Your one-stop sewing shop for beads, stones, trimming, threads and everything you need to create.",
  enable_reviews: true,
  enable_guest_checkout: true,
  facebook_url: "",
  instagram_url: "",
  about_story:
    "REEFA SEWING HUB started as a small sewing shop in Ghana. Founded in 2020, we began with a simple mission: to be a one-stop shop for quality fabrics, tailoring, and sewing supplies at affordable prices.\n\nWhat started as a small family business has grown into a trusted name in our community. We pride ourselves on knowing our customers by name and understanding their needs.\n\nToday, we're expanding our reach through our online platform, bringing the same personalized service and quality products to more customers across Ghana.",
  about_mission:
    "At REEFA SEWING HUB, we promise to continue providing quality products, excellent customer service, and a shopping experience that makes you feel like family. We're committed to growing with our community and adapting to meet your needs.",
  about_values: [
    {
      title: "Quality",
      description:
        "We carefully select our products to ensure we offer only the best quality items to our customers. From premium fabrics to sewing essentials, quality is our priority.",
    },
    {
      title: "Community",
      description:
        "We believe in building strong relationships with our community. We source locally when possible and actively participate in community initiatives.",
    },
    {
      title: "Affordability",
      description:
        "We strive to make quality fabrics and sewing supplies accessible to everyone by offering competitive prices and regular promotions on essential items.",
    },
  ],
}

// Reads the singleton store_settings row (public SELECT). Falls back to
// DEFAULT_SETTINGS so callers always get a fully-populated object.
export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", true)
      .single()

    if (error || !data) return DEFAULT_SETTINGS

    return {
      ...DEFAULT_SETTINGS,
      ...data,
      about_values:
        Array.isArray(data.about_values) && data.about_values.length === 3
          ? (data.about_values as StoreSettings["about_values"])
          : DEFAULT_SETTINGS.about_values,
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}
