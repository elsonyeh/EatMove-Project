import { NextResponse } from 'next/server'
import pool from '@/lib/db'

export async function POST(req: Request) {
  const { rid, dishid, price, description, image, name,category, isavailable,  ispopular } = await req.json()

  try {
    const result = await pool.query(
      `INSERT INTO menu (rid, dishid, price, description, image, name,category, isavailable,  ispopular)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9 )
       RETURNING *`,
      [rid, dishid, price, description, image, name,category, isavailable,  ispopular]
    )

    return NextResponse.json({ success: true, item: result.rows[0] })
  } catch (err) {
    console.error('❌ 新增商品失敗：', err)
    return NextResponse.json({ success: false, message: '資料庫寫入失敗' }, { status: 500 })
  }
}
