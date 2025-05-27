export interface Restaurant {
  id: string
  name: string
  description: string
  coverImage: string
  rating: number
  deliveryTime: string
  deliveryFee: number
  minimumOrder: number
  address: string
  phone: string
  cuisine: string
  isNew: boolean
  distance?: string
}

export interface MenuItem {
  id: string
  restaurantId: string
  name: string
  description: string
  price: number
  image: string
  category: string
  isPopular?: boolean
}

// 模擬餐廳資料 (精簡版)
export const restaurants: Restaurant[] = [
  // 中式料理
  {
    id: "restaurant-chinese-1",
    name: "京華樓",
    description: "正宗北方菜系，提供烤鴨、餃子等經典美食",
    coverImage: "/placeholder.svg?height=200&width=300&text=京華樓",
    rating: 4.7,
    deliveryTime: "30-45 分鐘",
    deliveryFee: 60,
    minimumOrder: 200,
    address: "台北市大安區忠孝東路四段101號",
    phone: "02-2771-1234",
    cuisine: "中式料理",
    isNew: false,
    distance: "2.5 km",
  },
  // 日式料理
  {
    id: "restaurant-japanese-1",
    name: "藤井壽司",
    description: "新鮮食材直送，正統江戶前壽司體驗",
    coverImage: "/placeholder.svg?height=200&width=300&text=藤井壽司",
    rating: 4.9,
    deliveryTime: "25-40 分鐘",
    deliveryFee: 80,
    minimumOrder: 350,
    address: "台北市大安區敦化南路一段233號",
    phone: "02-2731-2345",
    cuisine: "日式料理",
    isNew: false,
    distance: "2.7 km",
  },
  // 韓式料理
  {
    id: "restaurant-korean-1",
    name: "首爾之星",
    description: "正宗韓式烤肉，多種醬料可選，道地韓國風味",
    coverImage: "/placeholder.svg?height=200&width=300&text=首爾之星",
    rating: 4.8,
    deliveryTime: "35-50 分鐘",
    deliveryFee: 75,
    minimumOrder: 300,
    address: "台北市大安區復興南路一段107號",
    phone: "02-2711-4567",
    cuisine: "韓式料理",
    isNew: true,
    distance: "2.3 km",
  },
  // 義式料理
  {
    id: "restaurant-italian-1",
    name: "羅馬廚房",
    description: "道地義式料理，使用進口食材製作，品味義大利風情",
    coverImage: "/placeholder.svg?height=200&width=300&text=羅馬廚房",
    rating: 4.7,
    deliveryTime: "35-50 分鐘",
    deliveryFee: 80,
    minimumOrder: 300,
    address: "台北市大安區敦化南路二段100號",
    phone: "02-2709-6789",
    cuisine: "義式料理",
    isNew: false,
    distance: "2.8 km",
  },
  // 美式料理
  {
    id: "restaurant-american-1",
    name: "美味漢堡",
    description: "提供各種美味漢堡、薯條和飲料，道地美式風味",
    coverImage: "/placeholder.svg?height=200&width=300&text=美味漢堡",
    rating: 4.7,
    deliveryTime: "30-45 分鐘",
    deliveryFee: 60,
    minimumOrder: 150,
    address: "台北市信義區信義路五段7號",
    phone: "02-2345-6789",
    cuisine: "美式料理",
    isNew: false,
    distance: "1.2 km",
  },
  // 南洋料理
  {
    id: "restaurant-thai-1",
    name: "泰饗樂",
    description: "道地南洋風味，酸辣可口，讓您彷彿置身東南亞",
    coverImage: "/placeholder.svg?height=200&width=300&text=泰饗樂",
    rating: 4.6,
    deliveryTime: "30-45 分鐘",
    deliveryFee: 65,
    minimumOrder: 180,
    address: "台北市松山區南京東路五段123號",
    phone: "02-2756-1234",
    cuisine: "南洋料理",
    isNew: false,
    distance: "3.1 km",
  },
  // 素食
  {
    id: "restaurant-vegetarian-1",
    name: "綠色天地",
    description: "健康素食料理，使用有機食材，清爽可口",
    coverImage: "/placeholder.svg?height=200&width=300&text=綠色天地",
    rating: 4.7,
    deliveryTime: "30-45 分鐘",
    deliveryFee: 60,
    minimumOrder: 150,
    address: "台北市中正區羅斯福路三段300號",
    phone: "02-2365-4567",
    cuisine: "素食",
    isNew: false,
    distance: "3.4 km",
  },
  // 甜點
  {
    id: "restaurant-dessert-1",
    name: "甜點工坊",
    description: "手工製作各種甜點，口味多樣，甜蜜享受",
    coverImage: "/placeholder.svg?height=200&width=300&text=甜點工坊",
    rating: 4.8,
    deliveryTime: "25-40 分鐘",
    deliveryFee: 55,
    minimumOrder: 120,
    address: "台北市信義區松仁路100號",
    phone: "02-2723-7890",
    cuisine: "甜點",
    isNew: false,
    distance: "1.4 km",
  },
  // 飲料
  {
    id: "restaurant-beverage-1",
    name: "茶香坊",
    description: "精選台灣茶葉，手工調製，清爽解渴",
    coverImage: "/placeholder.svg?height=200&width=300&text=茶香坊",
    rating: 4.6,
    deliveryTime: "15-30 分鐘",
    deliveryFee: 40,
    minimumOrder: 100,
    address: "台北市大安區復興南路一段107號",
    phone: "02-2711-0123",
    cuisine: "飲料",
    isNew: false,
    distance: "2.1 km",
  },
]

// 模擬菜單項目 (精簡版)
export const menuItems: MenuItem[] = [
  // 中式料理 - 京華樓
  {
    id: "chinese-1-item-1",
    restaurantId: "restaurant-chinese-1",
    name: "北京烤鴨",
    description: "外皮酥脆，肉質鮮嫩，搭配特製醬料和薄餅",
    price: 580,
    image: "/placeholder.svg?height=100&width=100&text=北京烤鴨",
    category: "主餐",
    isPopular: true,
  },
  {
    id: "chinese-1-item-2",
    restaurantId: "restaurant-chinese-1",
    name: "宮保雞丁",
    description: "辣中帶甜，花生香脆，雞肉嫩滑",
    price: 220,
    image: "/placeholder.svg?height=100&width=100&text=宮保雞丁",
    category: "主餐",
    isPopular: true,
  },
  {
    id: "chinese-1-item-3",
    restaurantId: "restaurant-chinese-1",
    name: "蔥油餅",
    description: "層次分明，外酥內軟，蔥香四溢",
    price: 80,
    image: "/placeholder.svg?height=100&width=100&text=蔥油餅",
    category: "配菜",
  },

  // 日式料理 - 藤井壽司
  {
    id: "japanese-1-item-1",
    restaurantId: "restaurant-japanese-1",
    name: "特上握壽司",
    description: "新鮮海鮮，精緻擺盤，入口即化",
    price: 680,
    image: "/placeholder.svg?height=100&width=100&text=特上握壽司",
    category: "主餐",
    isPopular: true,
  },
  {
    id: "japanese-1-item-2",
    restaurantId: "restaurant-japanese-1",
    name: "茶碗蒸",
    description: "滑嫩蒸蛋，內含海鮮配料，清爽可口",
    price: 150,
    image: "/placeholder.svg?height=100&width=100&text=茶碗蒸",
    category: "配菜",
  },

  // 美式料理 - 美味漢堡
  {
    id: "american-1-item-1",
    restaurantId: "restaurant-american-1",
    name: "經典牛肉漢堡",
    description: "多汁牛肉，新鮮生菜，特製醬料，完美搭配",
    price: 220,
    image: "/placeholder.svg?height=100&width=100&text=經典牛肉漢堡",
    category: "主餐",
    isPopular: true,
  },
  {
    id: "american-1-item-2",
    restaurantId: "restaurant-american-1",
    name: "薯條",
    description: "外酥內軟，黃金比例，搭配特製醬料",
    price: 80,
    image: "/placeholder.svg?height=100&width=100&text=薯條",
    category: "配菜",
    isPopular: true,
  },
]

export const deliveryOrders = [
  {
    id: "DEL-001",
    restaurant: "京華樓",
    customer: "王小明",
    deliveryAddress: "台北市信義區信義路五段7號",
    restaurantAddress: "台北市大安區忠孝東路四段101號",
    estimatedDeliveryTime: "30-45 分鐘",
    deliveryFee: 60,
    distance: "2.5 km",
    notes: "請放在門口，不用按門鈴",
    status: "available", // available, accepted, picked, delivered, rejected
    items: [
      { name: "北京烤鴨", quantity: 1, price: 580, image: "/placeholder.svg?height=64&width=64&text=北京烤鴨" },
      { name: "宮保雞丁", quantity: 1, price: 220, image: "/placeholder.svg?height=64&width=64&text=宮保雞丁" },
    ],
  },
  {
    id: "DEL-002",
    restaurant: "藤井壽司",
    customer: "李美麗",
    deliveryAddress: "台北市中山區南京東路二段100號",
    restaurantAddress: "台北市大安區敦化南路一段233號",
    estimatedDeliveryTime: "25-40 分鐘",
    deliveryFee: 70,
    distance: "3.2 km",
    notes: "請送到辦公室",
    status: "accepted",
    items: [
      { name: "特上握壽司", quantity: 1, price: 680, image: "/placeholder.svg?height=64&width=64&text=特上握壽司" },
      { name: "茶碗蒸", quantity: 1, price: 150, image: "/placeholder.svg?height=64&width=64&text=茶碗蒸" },
    ],
  },
  {
    id: "DEL-003",
    restaurant: "美味漢堡",
    customer: "陳志明",
    deliveryAddress: "台北市大安區忠孝東路四段101號",
    restaurantAddress: "台北市信義區松壽路12號",
    estimatedDeliveryTime: "20-35 分鐘",
    deliveryFee: 50,
    distance: "1.8 km",
    notes: "",
    status: "completed",
    items: [
      { name: "經典牛肉漢堡", quantity: 1, price: 220, image: "/placeholder.svg?height=64&width=64&text=經典牛肉漢堡" },
      { name: "薯條", quantity: 1, price: 80, image: "/placeholder.svg?height=64&width=64&text=薯條" },
      { name: "可樂", quantity: 1, price: 50, image: "/placeholder.svg?height=64&width=64&text=可樂" },
    ],
  },
]

export const restaurantOrders = [
  {
    id: "ORD-001",
    customer: "王小明",
    time: "12:30",
    deliveryAddress: "台北市信義區信義路五段7號",
    total: 580,
    status: "pending", // pending, preparing, completed, rejected
    items: [{ name: "北京烤鴨", quantity: 1, price: 580, image: "/placeholder.svg?height=64&width=64&text=北京烤鴨" }],
  },
  {
    id: "ORD-002",
    customer: "李美麗",
    time: "13:45",
    deliveryAddress: "台北市中山區南京東路二段100號",
    total: 220,
    status: "preparing",
    items: [{ name: "宮保雞丁", quantity: 1, price: 220, image: "/placeholder.svg?height=64&width=64&text=宮保雞丁" }],
  },
  {
    id: "ORD-003",
    customer: "陳志明",
    time: "18:00",
    deliveryAddress: "台北市大安區忠孝東路四段101號",
    total: 180,
    status: "completed",
    items: [{ name: "水餃 (12顆)", quantity: 1, price: 180, image: "/placeholder.svg?height=64&width=64&text=水餃" }],
  },
]

export const cartItems = [
  {
    id: "cart-1",
    name: "北京烤鴨",
    restaurant: "京華樓",
    price: 580,
    quantity: 1,
    image: "/placeholder.svg?height=64&width=64&text=北京烤鴨",
  },
  {
    id: "cart-2",
    name: "特上握壽司",
    restaurant: "藤井壽司",
    price: 680,
    quantity: 2,
    image: "/placeholder.svg?height=64&width=64&text=特上握壽司",
  },
  {
    id: "cart-3",
    name: "經典牛肉漢堡",
    restaurant: "美味漢堡",
    price: 220,
    quantity: 1,
    image: "/placeholder.svg?height=64&width=64&text=經典牛肉漢堡",
  },
]

export const getRestaurantById = (id: string) => {
  return restaurants.find((restaurant) => restaurant.id === id)
}

export const getMenuItems = (restaurantId: string) => {
  return menuItems.filter((item) => item.restaurantId === restaurantId)
}

export const getPopularMenuItems = (restaurantId: string) => {
  return menuItems.filter((item) => item.restaurantId === restaurantId && item.isPopular)
}
