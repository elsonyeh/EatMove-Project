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
        -- 移除 account 欄位（如果存在）
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
      END $$;
    `);

    return NextResponse.json({
      success: true,
      message: "資料庫結構更新成功"
    });
  } catch (error: any) {
    console.error("資料庫修改失敗:", error);
    return NextResponse.json(
      { success: false, message: "資料庫修改失敗", error: error.message },
      { status: 500 }
    );
  }
} 