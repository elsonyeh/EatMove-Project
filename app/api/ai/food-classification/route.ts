import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

interface FoodClassification {
  category: string
  confidence: number
  foodType: string
  description: string
  keywords: string[]
  specificDishes: string[]
}

interface RestaurantRecommendation {
  rid: number
  rname: string
  raddress: string
  image: string
  rating: number
  cuisine: string
  deliveryTime: string
  deliveryFee: number
  matchReason: string
  matchScore: number
  distance?: string
  menuMatches: Array<{
    name: string
    price: number
    category: string
  }>
}

// 詳細的食物分類數據庫
const FOOD_DATABASE = {
  "中式料理": {
    keywords: ["中式", "中華", "台式", "粵菜", "川菜", "湘菜", "魯菜"],
    dishes: {
      "炒飯": ["蛋炒飯", "揚州炒飯", "鹹菜炒飯", "臘腸炒飯", "蝦仁炒飯"],
      "炒麵": ["牛肉炒麵", "雞肉炒麵", "海鮮炒麵", "素食炒麵", "炒河粉"],
      "湯麵": ["牛肉麵", "雞湯麵", "餛飩麵", "陽春麵", "擔仔麵"],
      "餃子": ["水餃", "煎餃", "蒸餃", "韭菜餃", "高麗菜餃"],
      "包子": ["小籠包", "肉包", "菜包", "豆沙包", "奶黃包"],
      "粥品": ["白粥", "瘦肉粥", "海鮮粥", "蔬菜粥", "廣東粥"],
      "燒烤": ["烤鴨", "叉燒", "燒雞", "燒肉", "蜜汁叉燒"]
    }
  },
  "日式料理": {
    keywords: ["日式", "日本", "和食"],
    dishes: {
      "壽司": ["握壽司", "軍艦壽司", "手卷", "生魚片", "散壽司"],
      "拉麵": ["豚骨拉麵", "味噌拉麵", "醬油拉麵", "鹽味拉麵", "沾麵"],
      "丼飯": ["牛丼", "豬排丼", "雞肉丼", "鰻魚丼", "天丼"],
      "烏龍麵": ["牛肉烏龍麵", "天婦羅烏龍麵", "咖哩烏龍麵", "鍋燒烏龍麵"],
      "天婦羅": ["蝦天婦羅", "蔬菜天婦羅", "綜合天婦羅"],
      "燒肉": ["和牛燒肉", "豬肉燒肉", "雞肉燒肉"]
    }
  },
  "西式料理": {
    keywords: ["西式", "美式", "歐式", "義式", "法式"],
    dishes: {
      "漢堡": ["牛肉漢堡", "雞肉漢堡", "豬肉漢堡", "素食漢堡", "起司漢堡"],
      "披薩": ["瑪格麗特披薩", "海鮮披薩", "夏威夷披薩", "四季披薩", "肉醬披薩"],
      "義大利麵": ["肉醬義大利麵", "白醬義大利麵", "青醬義大利麵", "海鮮義大利麵"],
      "牛排": ["菲力牛排", "肋眼牛排", "丁骨牛排", "紐約牛排"],
      "沙拉": ["凱薩沙拉", "希臘沙拉", "尼斯沙拉", "田園沙拉"],
      "三明治": ["總匯三明治", "烤雞三明治", "鮪魚三明治", "蔬菜三明治"]
    }
  },
  "韓式料理": {
    keywords: ["韓式", "韓國"],
    dishes: {
      "燒肉": ["韓式燒肉", "烤五花肉", "烤牛肉", "烤雞肉"],
      "拌飯": ["石鍋拌飯", "韓式拌飯", "蔬菜拌飯"],
      "湯品": ["泡菜湯", "牛肉湯", "豆腐湯", "海帶湯"],
      "炸雞": ["韓式炸雞", "蒜味炸雞", "甜辣炸雞"],
      "韓式料理": ["泡菜", "韓式煎餅", "辣炒年糕", "部隊鍋"]
    }
  },
  "南洋料理": {
    keywords: ["泰式", "越南", "南洋", "東南亞"],
    dishes: {
      "泰式料理": ["打拋豬", "綠咖哩", "紅咖哩", "泰式炒河粉", "酸辣湯"],
      "越南料理": ["越南河粉", "春捲", "越南法棍", "涼拌青木瓜"],
      "咖哩": ["椰漿咖哩", "紅咖哩", "綠咖哩", "咖哩雞"],
      "河粉": ["炒河粉", "湯河粉", "乾炒河粉"]
    }
  },
  "小吃類": {
    keywords: ["小吃", "夜市", "台灣小吃"],
    dishes: {
      "炸物": ["雞排", "鹽酥雞", "炸魷魚", "炸地瓜球", "炸豆腐"],
      "滷味": ["滷蛋", "滷豆干", "滷海帶", "滷大腸"],
      "關東煮": ["黑輪", "貢丸", "魚豆腐", "高麗菜捲"],
      "燒烤": ["烤香腸", "烤魷魚", "烤玉米", "烤肉串"]
    }
  },
  "甜點飲品": {
    keywords: ["甜點", "蛋糕", "飲料", "奶茶", "咖啡"],
    dishes: {
      "蛋糕": ["生日蛋糕", "起司蛋糕", "巧克力蛋糕", "水果蛋糕"],
      "甜品": ["布丁", "提拉米蘇", "馬卡龍", "泡芙"],
      "飲料": ["珍珠奶茶", "果汁", "氣泡飲", "茶類"],
      "冰品": ["剉冰", "冰淇淋", "霜淇淋", "雪花冰"]
    }
  }
}

// 模擬AI食物分類功能
function simulateAIClassification(imageBuffer: Buffer): FoodClassification {
  // 在實際應用中，這裡會使用真正的AI模型來分析圖片
  // 目前使用模擬數據來演示功能

  const categories = Object.keys(FOOD_DATABASE)
  const randomCategory = categories[Math.floor(Math.random() * categories.length)]
  const categoryData = FOOD_DATABASE[randomCategory as keyof typeof FOOD_DATABASE]
  
  const dishTypes = Object.keys(categoryData.dishes)
  const randomDishType = dishTypes[Math.floor(Math.random() * dishTypes.length)]
  const specificDishes = categoryData.dishes[randomDishType as keyof typeof categoryData.dishes]
  
  // 生成較高的信心度，模擬改進後的AI模型
  const confidence = 0.75 + Math.random() * 0.2 // 75%-95%的信心度

  return {
    category: randomCategory,
    confidence,
    foodType: randomDishType,
    description: `AI識別為${randomCategory}中的${randomDishType}類料理`,
    keywords: categoryData.keywords,
    specificDishes
  }
}

// 計算餐廳匹配度
async function calculateRestaurantMatches(
  classification: FoodClassification
): Promise<RestaurantRecommendation[]> {
  try {
    // 獲取所有開放的餐廳
    const restaurantQuery = `
      SELECT 
        r.rid,
        r.rname,
        r.raddress,
        r.image,
        r.rating,
        r.cuisine,
        r.description,
        r.min_order,
        r.delivery_area
      FROM restaurant r
      WHERE r.is_open = true
      ORDER BY r.rating DESC
    `
    
    const restaurantResult = await pool.query(restaurantQuery)
    const restaurants = restaurantResult.rows

    const recommendations: RestaurantRecommendation[] = []

    for (const restaurant of restaurants) {
      let matchScore = 0
      let matchReason = ""
      const menuMatches: Array<{ name: string; price: number; category: string }> = []

      // 1. 料理類型匹配 (40% 權重)
      const cuisine = restaurant.cuisine?.toLowerCase() || ""
      const categoryLower = classification.category.toLowerCase()
      
      if (classification.keywords.some(keyword => 
        cuisine.includes(keyword.toLowerCase()) || 
        restaurant.rname.toLowerCase().includes(keyword.toLowerCase())
      )) {
        matchScore += 40
        matchReason = `專門提供${classification.category}`
      }

      // 2. 具體菜品匹配 (50% 權重)
      const menuQuery = `
        SELECT name, price, category, description
        FROM menu 
        WHERE rid = $1 AND isavailable = true
      `
      
      try {
        const menuResult = await pool.query(menuQuery, [restaurant.rid])
        
        for (const menuItem of menuResult.rows) {
          const itemName = menuItem.name.toLowerCase()
          const itemCategory = menuItem.category?.toLowerCase() || ""
          const itemDesc = menuItem.description?.toLowerCase() || ""
          
          // 檢查是否匹配食物類型
          if (itemName.includes(classification.foodType.toLowerCase()) ||
              itemCategory.includes(classification.foodType.toLowerCase()) ||
              itemDesc.includes(classification.foodType.toLowerCase())) {
            matchScore += 15
            menuMatches.push({
              name: menuItem.name,
              price: menuItem.price,
              category: menuItem.category
            })
          }

          // 檢查是否匹配具體菜品
          for (const dish of classification.specificDishes) {
            if (itemName.includes(dish.toLowerCase()) ||
                itemDesc.includes(dish.toLowerCase())) {
              matchScore += 10
              if (!menuMatches.some(m => m.name === menuItem.name)) {
                menuMatches.push({
                  name: menuItem.name,
                  price: menuItem.price,
                  category: menuItem.category
                })
              }
            }
          }
        }
      } catch (menuError) {
        console.error(`獲取餐廳 ${restaurant.rid} 菜單失敗:`, menuError)
      }

      // 3. 餐廳評級加分 (10% 權重)
      const rating = parseFloat(restaurant.rating) || 0
      if (rating >= 4.5) matchScore += 10
      else if (rating >= 4.0) matchScore += 5

      // 只推薦匹配度較高的餐廳
      if (matchScore >= 30) {
        if (menuMatches.length > 0) {
          matchReason += `，有${menuMatches.length}道相關菜品`
        }

        recommendations.push({
          rid: restaurant.rid,
          rname: restaurant.rname,
          raddress: restaurant.raddress,
          image: restaurant.image || "/images/restaurants/default.jpg",
          rating: parseFloat(restaurant.rating) || 4.0,
          cuisine: restaurant.cuisine || "綜合料理",
          deliveryTime: "25-40分鐘",
          deliveryFee: 50 + Math.floor(Math.random() * 30), // 模擬外送費
          matchReason,
          matchScore,
          menuMatches: menuMatches.slice(0, 3) // 最多顯示3道菜
        })
      }
    }

    // 按匹配度排序
    recommendations.sort((a, b) => b.matchScore - a.matchScore)
    
    return recommendations.slice(0, 8) // 最多返回8個推薦
    
  } catch (error) {
    console.error("計算餐廳匹配度失敗:", error)
    return []
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get("image") as File
    
    if (!imageFile) {
      return NextResponse.json(
        { success: false, message: "請上傳圖片檔案" },
        { status: 400 }
      )
    }

    // 檢查檔案類型
    if (!imageFile.type.startsWith("image/")) {
      return NextResponse.json(
        { success: false, message: "請上傳有效的圖片檔案" },
        { status: 400 }
      )
    }

    // 檢查檔案大小 (最大10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: "圖片檔案不能超過10MB" },
        { status: 400 }
      )
    }

    // 將檔案轉換為Buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    // 執行AI食物分類
    const classification = simulateAIClassification(imageBuffer)

    // 獲取餐廳推薦
    const recommendations = await calculateRestaurantMatches(classification)

    return NextResponse.json({
      success: true,
      classification: {
        category: classification.category,
        confidence: Math.round(classification.confidence * 100),
        foodType: classification.foodType,
        description: classification.description
      },
      recommendations,
      total: recommendations.length
    })

  } catch (error) {
    console.error("食物分類API錯誤:", error)
    return NextResponse.json(
      { success: false, message: "處理圖片時發生錯誤" },
      { status: 500 }
    )
  }
} 