import { RestaurantCard } from "@/components/restaurant-card"
import { restaurants } from "@/lib/data"

export default function UserRecentPage() {
  // 模擬用戶最近瀏覽的店家
  const recentRestaurants = restaurants.slice(3, 9)

  return (
    <div className="container py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">近期瀏覽</h1>
        <p className="text-muted-foreground">您最近瀏覽過的店家</p>
      </div>

      {recentRestaurants.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {recentRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h2 className="text-xl font-medium mb-2">您還沒有瀏覽過任何店家</h2>
          <p className="text-muted-foreground mb-4">開始探索附近的美食吧！</p>
        </div>
      )}
    </div>
  )
}
