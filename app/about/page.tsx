import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { getStoreSettings } from "@/lib/settings"

export default async function AboutPage() {
  const settings = await getStoreSettings()
  const storyParagraphs = settings.about_story
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">About {settings.store_name}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          {storyParagraphs.map((paragraph, i) => (
            <p key={i} className="text-lg mb-4 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="relative h-[400px] rounded-lg overflow-hidden">
          <Image src="/placeholder.svg?height=400&width=600" alt={settings.store_name} fill className="object-cover" />
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-center mb-8">Our Values</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {settings.about_values.map((value, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <h3 className="text-xl font-medium mb-2">{value.title}</h3>
              <p>{value.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-green-50 dark:bg-green-950 p-8 rounded-lg">
        <h2 className="text-2xl font-semibold text-center mb-6">Our Mission</h2>
        <p className="text-lg text-center max-w-3xl mx-auto">{settings.about_mission}</p>
      </div>
    </div>
  )
}
