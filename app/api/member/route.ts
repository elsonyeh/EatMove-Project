console.log("🔌 使用的 DATABASE_URL：", process.env.DATABASE_URL)

import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { mid, name, address, phonenumber, email, introducer } = await req.json()

    console.log("📥 收到前端送來的會員資料：", { mid, name, address, phonenumber, email, introducer })
    console.log("🚀 準備將資料寫入資料庫")

    const result = await pool.query(
      `INSERT INTO member (
        mid, name, address, createtime, wallet, phonenumber, email, introducer
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, 0, $4, $5, $6)
      RETURNING *`,
      [mid, name, address, phonenumber, email, introducer || null]
    )

    console.log("✅ 寫入成功，資料為：", result.rows[0])

    return NextResponse.json({
      success: true,
      member: result.rows[0],
    })
  } catch (err) {
    console.error("❌ 新增會員失敗：", err)
    return NextResponse.json(
      { success: false, message: "會員註冊失敗：" + (err as Error).message },
      { status: 500 }
    )
  }
}
