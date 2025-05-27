"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Star } from "lucide-react"

interface RatingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order?: {
    oid: number
    rid: number
    did?: number
  }
  userId?: string
}

export function RatingDialog({ open, onOpenChange, order, userId }: RatingDialogProps) {
  const { toast } = useToast()
  const [restaurantRating, setRestaurantRating] = useState(0)
  const [deliveryRating, setDeliveryRating] = useState(0)
  const [restaurantComment, setRestaurantComment] = useState("")
  const [deliveryComment, setDeliveryComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (restaurantRating === 0 || deliveryRating === 0) {
      toast({
        title: "請評分",
        description: "請為餐廳和外送員評分",
        variant: "destructive",
      })
      return
    }

    if (!order || !userId) {
      toast({
        title: "錯誤",
        description: "缺少訂單資訊",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oid: order.oid,
          uid: userId,
          rid: order.rid,
          did: order.did || null,
          restaurantRating,
          deliveryRating,
          restaurantComment,
          deliveryComment
        })
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "評分提交成功",
          description: "感謝您的評分！"
        })

        // 重置表單
        setRestaurantRating(0)
        setDeliveryRating(0)
        setRestaurantComment("")
        setDeliveryComment("")

        onOpenChange(false)
      } else {
        toast({
          title: "評分提交失敗",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("提交評分失敗:", error)
      toast({
        title: "評分提交失敗",
        description: "網路錯誤，請稍後再試",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>評分此訂單</DialogTitle>
          <DialogDescription>請為餐廳和外送員評分，您的意見對我們很重要</DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="font-medium">餐廳評分</h3>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" className="p-1" onClick={() => setRestaurantRating(star)}>
                  <Star
                    className={`h-8 w-8 ${star <= restaurantRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      }`}
                  />
                  <span className="sr-only">{star} 星</span>
                </button>
              ))}
            </div>
            <Textarea
              placeholder="分享您對餐廳的評價..."
              value={restaurantComment}
              onChange={(e) => setRestaurantComment(e.target.value)}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <h3 className="font-medium">外送員評分</h3>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" className="p-1" onClick={() => setDeliveryRating(star)}>
                  <Star
                    className={`h-8 w-8 ${star <= deliveryRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                      }`}
                  />
                  <span className="sr-only">{star} 星</span>
                </button>
              ))}
            </div>
            <Textarea
              placeholder="分享您對外送服務的評價..."
              value={deliveryComment}
              onChange={(e) => setDeliveryComment(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "提交中..." : "送出評分"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
