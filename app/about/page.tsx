import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-8">About Betza Store</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
          <p className="text-lg mb-4">
            Betza Store started as a small neighborhood grocery in Lagos, Nigeria. Founded in 2020, we began with a
            simple mission: to provide fresh, quality groceries to our local community at affordable prices.
          </p>
          <p className="text-lg mb-4">
            What started as a small family business has grown into a trusted name in our community. We pride ourselves
            on knowing our customers by name and understanding their needs.
          </p>
          <p className="text-lg">
            Today, we're expanding our reach through our online platform, bringing the same personalized service and
            quality products to more customers across Nigeria.
          </p>
        </div>
        <div className="relative h-[400px] rounded-lg overflow-hidden">
          <Image src="/placeholder.svg?height=400&width=600" alt="Betza Store" fill className="object-cover" />
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-center mb-8">Our Values</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-medium mb-2">Quality</h3>
            <p>
              We carefully select our products to ensure we offer only the best quality items to our customers. From
              fresh produce to household essentials, quality is our priority.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-medium mb-2">Community</h3>
            <p>
              We believe in building strong relationships with our community. We source locally when possible and
              actively participate in community initiatives.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <h3 className="text-xl font-medium mb-2">Affordability</h3>
            <p>
              We strive to make quality groceries accessible to everyone by offering competitive prices and regular
              promotions on essential items.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-green-50 dark:bg-green-950 p-8 rounded-lg">
        <h2 className="text-2xl font-semibold text-center mb-6">Our Promise</h2>
        <p className="text-lg text-center max-w-3xl mx-auto">
          At Betza Store, we promise to continue providing quality products, excellent customer service, and a shopping
          experience that makes you feel like family. We're committed to growing with our community and adapting to meet
          your needs.
        </p>
      </div>
    </div>
  )
}
