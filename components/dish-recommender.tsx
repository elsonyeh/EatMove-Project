import { Sparkles } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface DishRecommenderProps {
  restaurantName: string
  cuisine: string
  menu: any[]
}

export function DishRecommender({ restaurantName, cuisine, menu }: DishRecommenderProps) {
  // 從菜單中找出價格最高的兩個項目作為推薦
  const popularItems = [...menu]
    .sort((a, b) => b.price - a.price)
    .slice(0, 2)
    .map((item) => item.name)
    .join("和")

  // 根據料理類型生成靜態推薦文字
  const getRecommendationText = () => {
    if (menu.length === 0) return `${restaurantName}的招牌菜即將推出，敬請期待！`

    const cuisineRecommendations: Record<string, string> = {
      中式料理: `推薦您品嚐${restaurantName}的${popularItems}，正宗${cuisine}風味，讓您回味無窮。`,
      日式料理: `${restaurantName}的${popularItems}是不可錯過的選擇，新鮮食材搭配道地${cuisine}手法。`,
      韓式料理: `${popularItems}是${restaurantName}的招牌菜品，道地${cuisine}風味，香辣可口。`,
      義式料理: `${restaurantName}的${popularItems}使用進口食材製作，正宗${cuisine}風味。`,
      美式料理: `${popularItems}是${restaurantName}的熱門選擇，道地${cuisine}風味，份量十足。`,
      南洋料理: `推薦您嘗試${restaurantName}的${popularItems}，酸辣可口的${cuisine}風味。`,
      素食: `${restaurantName}的${popularItems}採用新鮮有機食材，健康美味的${cuisine}選擇。`,
      甜點: `${restaurantName}的${popularItems}是甜點愛好者的最愛，精緻可口。`,
      飲料: `${restaurantName}的${popularItems}是解渴首選，清爽可口。`,
    }

    return cuisineRecommendations[cuisine] || `推薦您品嚐${restaurantName}的${popularItems}，是本店熱門選擇。`
  }

  return (
    <Card className="bg-gradient-to-r from-brand-primary/5 to-brand-secondary/5 border-brand-primary/20 mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className="bg-brand-primary/10 p-2 rounded-full">
            <Sparkles className="h-5 w-5 text-brand-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium mb-1">推薦美食</h3>
            <p className="text-sm">{getRecommendationText()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
