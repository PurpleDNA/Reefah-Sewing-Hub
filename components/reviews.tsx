"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { Star, StarIcon } from "lucide-react"
import type { Review } from "@/types"
import { formatDistanceToNow } from "date-fns"

interface ReviewsProps {
  productId: string
  reviews: Review[]
}

export function Reviews({ productId, reviews: initialReviews }: ReviewsProps) {
  const { user } = useAuth()
  const [reviews, setReviews] = useState(initialReviews)
  const [comment, setComment] = useState("")
  const [rating, setRating] = useState(5)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to leave a review.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = await createClient()

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          comment,
        })
        .select("*, profiles:user_id(full_name)")
        .single()

      if (error) throw error

      setReviews((prev) => [data, ...prev])
      setComment("")
      setRating(5)

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      })
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="py-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>

      {user && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Write a Review</h3>
          <form onSubmit={handleSubmitReview}>
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <p className="mr-2">Rating:</p>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setRating(star)} className="focus:outline-none">
                      {star <= rating ? (
                        <StarIcon className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ) : (
                        <StarIcon className="h-5 w-5 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea
                placeholder="Share your thoughts about this product..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
                required
              />
            </div>
            <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="border-b pb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <div className="flex items-center text-amber-400 mr-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-current" : "text-gray-300"}`} />
                    ))}
                  </div>
                  <span className="font-medium">{review.profiles?.full_name || "Anonymous"}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  {review.created_at && formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                </span>
              </div>
              <p className="text-gray-700">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
