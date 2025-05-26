import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    // 修改 member 表格
    await pool.query(`
      DO $$ 
      BEGIN 
        -- 添加 face_descriptor 欄位到 member 表格
        BEGIN
          ALTER TABLE member ADD COLUMN face_descriptor float8[];
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;

        -- 確保 email 是唯一的
        BEGIN
          ALTER TABLE member ADD CONSTRAINT member_email_unique UNIQUE (email);
        EXCEPTION 
          WHEN duplicate_table THEN 
            NULL;
        END;
      END $$;
    `);

    // 修改 deliveryman 表格
    await pool.query(`
      DO $$ 
      BEGIN 
        -- 添加 face_descriptor 欄位到 deliveryman 表格
        BEGIN
          ALTER TABLE deliveryman ADD COLUMN face_descriptor float8[];
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;

        -- 確保 demail 是唯一的
        BEGIN
          ALTER TABLE deliveryman ADD CONSTRAINT deliveryman_demail_unique UNIQUE (demail);
        EXCEPTION 
          WHEN duplicate_table THEN 
            NULL;
        END;

        -- 確保 demail 不為空
        BEGIN
          ALTER TABLE deliveryman ALTER COLUMN demail SET NOT NULL;
        EXCEPTION 
          WHEN duplicate_object THEN 
            NULL;
        END;
      END $$;
    `);

    // 修改 restaurant 表格
    await pool.query(`
      DO $$ 
      BEGIN 
        -- 刪除 account 欄位（如果存在）
        BEGIN
          ALTER TABLE restaurant DROP COLUMN IF EXISTS account;
        EXCEPTION 
          WHEN undefined_column THEN 
            NULL;
        END;

        -- 確保 remail 是唯一的
        BEGIN
          ALTER TABLE restaurant ADD CONSTRAINT restaurant_remail_unique UNIQUE (remail);
        EXCEPTION 
          WHEN duplicate_table THEN 
            NULL;
        END;

        -- 確保 remail 不為空
        BEGIN
          ALTER TABLE restaurant ALTER COLUMN remail SET NOT NULL;
        EXCEPTION 
          WHEN duplicate_object THEN 
            NULL;
        END;

        -- 為 restaurant 表格添加新欄位
        BEGIN
          ALTER TABLE restaurant ADD COLUMN rating DECIMAL(2,1) DEFAULT 4.5;
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;

        -- 添加 min_order 欄位（最低訂購金額）
        BEGIN
          ALTER TABLE restaurant ADD COLUMN min_order INTEGER DEFAULT 300;
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;

        -- 添加 image 欄位（餐廳圖片）
        BEGIN
          ALTER TABLE restaurant ADD COLUMN image VARCHAR(255) DEFAULT '/images/restaurants/default.jpg';
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;

        -- 添加 business_hours 欄位（營業時間）
        BEGIN
          ALTER TABLE restaurant ADD COLUMN business_hours VARCHAR(100) DEFAULT '09:00-22:00';
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;

        -- 添加 is_open 欄位（是否營業中）
        BEGIN
          ALTER TABLE restaurant ADD COLUMN is_open BOOLEAN DEFAULT true;
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;

        -- 添加 delivery_area 欄位（外送區域）
        BEGIN
          ALTER TABLE restaurant ADD COLUMN delivery_area TEXT DEFAULT '高雄市';
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;

        -- 添加 cuisine 欄位（料理類型）
        BEGIN
          ALTER TABLE restaurant ADD COLUMN cuisine VARCHAR(50) DEFAULT '綜合料理';
        EXCEPTION 
          WHEN duplicate_column THEN 
            NULL;
        END;

      END $$;
    `);

    // 創建訂單系統表格
    await pool.query(`
      -- 創建訂單表
      CREATE TABLE IF NOT EXISTS orders (
        oid SERIAL PRIMARY KEY,
        mid VARCHAR REFERENCES member(mid),
        rid INTEGER REFERENCES restaurant(rid),
        did INTEGER REFERENCES deliveryman(did),
        order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        delivery_address TEXT NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'ready', 'delivering', 'completed', 'cancelled')),
        estimated_delivery_time TIMESTAMP,
        actual_delivery_time TIMESTAMP,
        notes TEXT,
        payment_method VARCHAR(20) DEFAULT 'cash',
        restaurant_rating INTEGER CHECK (restaurant_rating >= 1 AND restaurant_rating <= 5),
        delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      -- 創建訂單項目表
      CREATE TABLE IF NOT EXISTS order_items (
        item_id SERIAL PRIMARY KEY,
        oid INTEGER REFERENCES orders(oid) ON DELETE CASCADE,
        rid INTEGER NOT NULL,
        dishid INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price DECIMAL(10,2) NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        special_instructions TEXT,
        FOREIGN KEY (rid, dishid) REFERENCES menu(rid, dishid)
      );
    `);

    await pool.query(`
      -- 創建評分表
      CREATE TABLE IF NOT EXISTS ratings (
        rating_id SERIAL PRIMARY KEY,
        oid INTEGER REFERENCES orders(oid),
        mid VARCHAR REFERENCES member(mid),
        rid INTEGER REFERENCES restaurant(rid),
        did INTEGER REFERENCES deliveryman(did),
        restaurant_rating INTEGER CHECK (restaurant_rating >= 1 AND restaurant_rating <= 5),
        delivery_rating INTEGER CHECK (delivery_rating >= 1 AND delivery_rating <= 5),
        restaurant_comment TEXT,
        delivery_comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 先刪除現有的購物車表格（如果存在）
    await pool.query(`DROP TABLE IF EXISTS cart_items CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS cart CASCADE;`);

    // 創建購物車系統表格 - 使用正確的主鍵欄位名稱
    await pool.query(`
      -- 創建購物車表
      CREATE TABLE cart (
        cart_id SERIAL PRIMARY KEY,
        mid VARCHAR REFERENCES member(mid),
        rid INTEGER REFERENCES restaurant(rid),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(mid, rid) -- 每個用戶在每個餐廳只能有一個購物車
      );
    `);

    await pool.query(`
      -- 創建購物車項目表
      CREATE TABLE cart_items (
        cart_item_id SERIAL PRIMARY KEY,
        cart_id INTEGER REFERENCES cart(cart_id) ON DELETE CASCADE,
        rid INTEGER NOT NULL,
        dishid INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
        special_instructions TEXT,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rid, dishid) REFERENCES menu(rid, dishid),
        UNIQUE(cart_id, rid, dishid) -- 同一個購物車中每個菜單項目只能有一筆記錄
      );
    `);

    // 創建索引以提高查詢效能
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_orders_mid ON orders(mid);
      CREATE INDEX IF NOT EXISTS idx_orders_rid ON orders(rid);
      CREATE INDEX IF NOT EXISTS idx_orders_did ON orders(did);
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_order_items_oid ON order_items(oid);
      CREATE INDEX IF NOT EXISTS idx_ratings_oid ON ratings(oid);
      CREATE INDEX IF NOT EXISTS idx_cart_mid ON cart(mid);
      CREATE INDEX IF NOT EXISTS idx_cart_rid ON cart(rid);
      CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
      CREATE INDEX IF NOT EXISTS idx_cart_items_mid ON cart_items(mid);
    `);

    // 更新現有餐廳的預設值
    await pool.query(`
      UPDATE restaurant 
      SET 
        rating = CASE 
          WHEN rating IS NULL OR rating = 0 THEN 4.5 
          ELSE rating 
        END,
        min_order = CASE 
          WHEN min_order IS NULL OR min_order = 0 THEN 300 
          ELSE min_order 
        END,
        image = CASE 
          WHEN image IS NULL OR image = '' THEN '/images/restaurants/default.jpg' 
          ELSE image 
        END,
        delivery_area = CASE 
          WHEN delivery_area IS NULL OR delivery_area = '' THEN '高雄市' 
          ELSE '高雄市' 
        END,
        cuisine = CASE 
          WHEN cuisine IS NULL OR cuisine = '' THEN '綜合料理' 
          ELSE cuisine 
        END
      WHERE rating IS NULL OR min_order IS NULL OR image IS NULL OR delivery_area IS NULL OR cuisine IS NULL;
    `);

    return NextResponse.json({
      success: true,
      message: "資料庫結構更新成功，已修復購物車表格的外鍵約束（使用mid作為member主鍵）"
    });
  } catch (error: any) {
    console.error("資料庫修改失敗:", error);
    return NextResponse.json(
      { success: false, message: "資料庫修改失敗", error: error.message },
      { status: 500 }
    );
  }
} 