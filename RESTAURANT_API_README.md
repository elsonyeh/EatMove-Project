# 餐廳 API 功能說明

## 概述

已成功將用戶頁面從硬編碼資料改為動態讀取資料庫資料，並加入了距離計算和搜尋功能。

## 新增功能

### 1. 動態餐廳資料讀取

- 從資料庫讀取真實的餐廳資訊
- 支援餐廳名稱、地址、描述、電話等完整資訊
- 自動從菜單推斷餐廳主要菜系

### 2. 智能距離計算

- 根據用戶位置和餐廳地址計算實際距離
- 使用 Haversine 公式進行精確計算
- 支援台灣主要城市區域的座標對應

### 3. 動態送達時間估算

- 根據距離自動計算預估送達時間
- 距離越近，送達時間越短
- 考慮交通狀況的合理時間範圍

### 4. 智能外送費計算

- 基於距離的動態外送費計算
- 近距離較便宜，遠距離適當增加費用
- 公平合理的收費機制

### 5. 強化搜尋功能

- 支援餐廳名稱搜尋
- 支援菜品名稱搜尋
- 支援菜系類別搜尋
- 支援餐廳描述搜尋

### 6. 類別過濾

- 支援按菜系類別過濾餐廳
- 中式、日式、韓式、義式、美式等多種菜系
- 動態從資料庫菜單推斷菜系類型

## API 端點

### 1. 獲取餐廳列表

```
GET /api/restaurants
```

**參數：**

- `search`: 搜尋關鍵字（可選）
- `category`: 菜系類別（可選）
- `lat`: 用戶緯度（可選）
- `lng`: 用戶經度（可選）
- `address`: 用戶地址（可選）

**回應：**

```json
{
  "success": true,
  "restaurants": [
    {
      "id": 1,
      "name": "京華樓",
      "cuisine": "中式料理",
      "rating": 4.5,
      "image": "/images/restaurants/default.jpg",
      "description": "正宗北方菜系，提供烤鴨、餃子等經典美食",
      "deliveryTime": "25-40",
      "minOrder": 300,
      "deliveryFee": 70,
      "distance": 3.2,
      "address": "台北市大安區忠孝東路四段101號",
      "phone": "02-2771-1234",
      "menuPreview": [...]
    }
  ],
  "total": 5
}
```

### 2. 獲取餐廳菜單

```
GET /api/restaurants/[rid]/menu
```

**參數：**

- `category`: 菜品類別過濾（可選）
- `search`: 菜品搜尋（可選）

**回應：**

```json
{
  "success": true,
  "restaurant": {
    "id": 1,
    "name": "京華樓",
    "address": "台北市大安區忠孝東路四段101號",
    "description": "正宗北方菜系..."
  },
  "menu": {
    "中式料理": [
      {
        "id": "1-1",
        "dishId": 1,
        "name": "北京烤鴨",
        "description": "外皮酥脆，肉質鮮嫩...",
        "price": 580,
        "image": "/images/menu/default.jpg",
        "category": "中式料理",
        "isPopular": true,
        "isAvailable": true
      }
    ]
  },
  "categories": ["中式料理"],
  "totalItems": 3
}
```

## 距離計算功能

### 支援的台灣區域

- 信義區、大安區、中山區、松山區
- 內湖區、士林區、北投區、中正區
- 萬華區、文山區、南港區、大同區

### 距離計算邏輯

```typescript
// 1公里內：15-25分鐘，外送費50元
// 1-2公里：20-30分鐘，外送費50元
// 2-3公里：25-35分鐘，外送費70元
// 3-5公里：30-45分鐘，外送費90元
// 5-8公里：40-55分鐘，外送費90元
// 8公里以上：50-70分鐘，外送費110元
```

## 測試資料

### 插入測試資料

```
POST /api/restaurants/test-data
```

這個端點會自動插入以下測試餐廳：

1. 京華樓（中式料理）
2. 藤井壽司（日式料理）
3. 首爾之星（韓式料理）
4. 羅馬廚房（義式料理）
5. 美味漢堡（美式料理）

每個餐廳都包含 3-4 道測試菜品。

## 使用方式

### 1. 初始化測試資料

```bash
curl -X POST http://localhost:3000/api/restaurants/test-data
```

### 2. 測試餐廳列表 API

```bash
# 獲取所有餐廳
curl "http://localhost:3000/api/restaurants"

# 搜尋中式料理
curl "http://localhost:3000/api/restaurants?category=chinese"

# 搜尋關鍵字
curl "http://localhost:3000/api/restaurants?search=烤鴨"

# 指定用戶位置
curl "http://localhost:3000/api/restaurants?address=台北市信義區&lat=25.0330&lng=121.5654"
```

### 3. 測試菜單 API

```bash
# 獲取餐廳菜單
curl "http://localhost:3000/api/restaurants/1/menu"

# 搜尋菜品
curl "http://localhost:3000/api/restaurants/1/menu?search=烤鴨"
```

## 注意事項

### TypeScript 類型問題

目前存在一個已知的 TypeScript 類型不匹配問題：

- 資料庫返回的餐廳 ID 是`number`類型
- 現有的 favorites 系統期望`string`類型的 ID

**臨時解決方案：**
在比較 favorites 時，可能需要進行類型轉換。這個問題不影響功能運行，只是 TypeScript 編譯時的警告。

### 地理位置權限

- 系統會嘗試獲取用戶的地理位置
- 如果用戶拒絕授權，會使用預設地址（台北市信義區）
- 可以手動在搜尋欄中輸入地址

### 圖片資源

- 目前使用預設圖片路徑
- 可以通過菜單管理功能上傳實際的餐廳和菜品圖片

## 未來改進

1. **圖片管理**：整合圖片上傳功能
2. **評分系統**：實現真實的用戶評分機制
3. **營業時間**：加入餐廳營業時間判斷
4. **庫存管理**：實時菜品庫存狀態
5. **推薦算法**：基於用戶偏好的智能推薦
