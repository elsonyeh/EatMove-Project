# 購物車資料庫實現說明

## 📊 資料庫表格設計

### 1. `cart` 表格（購物車主表）

```sql
CREATE TABLE cart (
    cart_id SERIAL PRIMARY KEY,
    uid INTEGER REFERENCES member(uid),
    rid INTEGER REFERENCES restaurant(rid),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(uid, rid) -- 每個用戶在每個餐廳只能有一個購物車
);
```

**欄位說明：**

- `cart_id`：購物車 ID（主鍵）
- `uid`：用戶 ID（外鍵，關聯 member 表）
- `rid`：餐廳 ID（外鍵，關聯 restaurant 表）
- `created_at`：創建時間
- `updated_at`：最後更新時間
- **唯一約束**：每個用戶在每個餐廳只能有一個購物車

### 2. `cart_items` 表格（購物車項目表）

```sql
CREATE TABLE cart_items (
    cart_item_id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES cart(cart_id) ON DELETE CASCADE,
    mid INTEGER REFERENCES menu(mid),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    special_instructions TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cart_id, mid) -- 同一個購物車中每個菜單項目只能有一筆記錄
);
```

**欄位說明：**

- `cart_item_id`：購物車項目 ID（主鍵）
- `cart_id`：購物車 ID（外鍵，關聯 cart 表）
- `mid`：菜單項目 ID（外鍵，關聯 menu 表）
- `quantity`：數量（必須大於 0）
- `special_instructions`：特殊要求
- `added_at`：加入時間
- `updated_at`：最後更新時間
- **唯一約束**：同一個購物車中每個菜單項目只能有一筆記錄
- **級聯刪除**：當購物車被刪除時，相關項目也會被刪除

## 🔧 API 端點

### 1. 購物車管理 API (`/api/cart`)

#### GET - 獲取購物車內容

```
GET /api/cart?uid={用戶ID}&rid={餐廳ID}
```

**回應格式：**

```json
{
  "success": true,
  "cart": {
    "cart_id": 1,
    "items": [
      {
        "cart_item_id": 1,
        "mid": 10,
        "name": "牛肉麵",
        "price": 150,
        "quantity": 2,
        "image": "/images/menu/beef-noodle.jpg",
        "description": "香濃牛肉湯頭",
        "specialInstructions": "不要辣",
        "subtotal": 300
      }
    ],
    "total": 300,
    "itemCount": 2
  }
}
```

#### POST - 添加商品到購物車

```json
{
  "uid": 1,
  "rid": 5,
  "mid": 10,
  "quantity": 1,
  "specialInstructions": "不要辣"
}
```

#### DELETE - 清空購物車

```
DELETE /api/cart?uid={用戶ID}&rid={餐廳ID}
```

### 2. 購物車項目管理 API (`/api/cart/[cart_item_id]`)

#### PUT - 更新購物車項目

```json
{
  "quantity": 3,
  "specialInstructions": "加辣"
}
```

#### DELETE - 刪除購物車項目

```
DELETE /api/cart/{cart_item_id}
```

## 🎨 前端組件

### CartDB 組件 (`components/cart-db.tsx`)

**特點：**

- 使用資料庫存儲，支援跨設備同步
- 即時載入和更新購物車內容
- 支援數量調整、特殊要求修改
- 自動計算總價和項目數量
- 完整的錯誤處理和用戶提示

**使用方式：**

```tsx
import CartDB, { CartRef } from "@/components/cart-db";

const restaurantPage = () => {
  const cartRef = useRef<CartRef>(null);

  const handleAddToCart = (item) => {
    cartRef.current?.addToCart(item);
  };

  return (
    <div>
      {/* 餐廳內容 */}
      <CartDB
        ref={cartRef}
        restaurantId={restaurantId}
        restaurantName={restaurantName}
        minOrder={300}
        deliveryFee={50}
        onOrderSuccess={() => console.log("訂單成功")}
      />
    </div>
  );
};
```

## 🔄 資料流程

### 1. 添加商品到購物車

1. 用戶點擊「加入購物車」
2. 檢查是否已有該餐廳的購物車，沒有則創建
3. 檢查商品是否已在購物車中
   - 已存在：更新數量
   - 不存在：新增項目
4. 更新購物車時間戳
5. 重新載入購物車顯示

### 2. 修改購物車項目

1. 用戶修改數量或特殊要求
2. 發送 PUT 請求更新項目
3. 更新購物車時間戳
4. 重新載入購物車顯示

### 3. 刪除購物車項目

1. 用戶點擊刪除按鈕
2. 刪除該項目
3. 檢查購物車是否為空
   - 為空：刪除整個購物車
   - 不為空：更新時間戳
4. 重新載入購物車顯示

### 4. 提交訂單

1. 驗證購物車內容和地址
2. 創建訂單記錄
3. 清空購物車
4. 跳轉到訂單確認頁面

## 🔍 索引優化

為了提高查詢效能，已創建以下索引：

```sql
CREATE INDEX idx_cart_uid ON cart(uid);
CREATE INDEX idx_cart_rid ON cart(rid);
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_mid ON cart_items(mid);
```

## 🆚 與 localStorage 方案比較

| 特點       | localStorage | 資料庫   |
| ---------- | ------------ | -------- |
| 響應速度   | 極快         | 快       |
| 跨設備同步 | ❌           | ✅       |
| 資料持久性 | 易丟失       | 永久保存 |
| 離線使用   | ✅           | ❌       |
| 資料分析   | ❌           | ✅       |
| 伺服器負載 | 無           | 輕微     |
| 實現複雜度 | 簡單         | 中等     |

## 🚀 部署步驟

1. **執行資料庫設置**

   ```bash
   curl http://localhost:3000/api/db-setup
   ```

2. **驗證表格創建**

   ```bash
   curl http://localhost:3000/api/check-tables
   ```

3. **測試購物車 API**

   ```bash
   # 添加商品到購物車
   curl -X POST http://localhost:3000/api/cart \
     -H "Content-Type: application/json" \
     -d '{"uid":1,"rid":1,"mid":1,"quantity":1}'

   # 獲取購物車內容
   curl "http://localhost:3000/api/cart?uid=1&rid=1"
   ```

4. **更新前端組件**
   - 將現有的 `Cart` 組件替換為 `CartDB` 組件
   - 或者提供選項讓用戶選擇使用哪種存儲方式

## 🔧 維護建議

1. **定期清理**：設置定時任務清理超過 30 天未更新的購物車
2. **監控效能**：監控購物車相關 API 的響應時間
3. **備份策略**：購物車資料雖然不是核心業務資料，但建議定期備份
4. **快取策略**：考慮使用 Redis 快取熱門商品的購物車資料

## 📝 注意事項

1. **用戶認證**：目前使用 localStorage 存儲用戶 ID，生產環境需要實現完整的用戶認證系統
2. **併發處理**：多個設備同時操作同一購物車時的併發控制
3. **資料一致性**：確保購物車中的商品價格與菜單中的價格保持一致
4. **容錯處理**：網路異常時的降級策略（可考慮暫時使用 localStorage）
