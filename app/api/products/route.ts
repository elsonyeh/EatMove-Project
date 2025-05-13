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
// 🗑️ 刪除商品：DELETE
export async function DELETE(req: Request) {
  const { dishid } = await req.json()

  if (!dishid) {
    return NextResponse.json(
      { success: false, message: '缺少 dishid' },
      { status: 400 }
    )
  }

  try {
    const result = await pool.query(
      'DELETE FROM menu WHERE dishid = $1 RETURNING *',
      [dishid]
    )

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: '找不到對應商品' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] })
  } catch (err) {
    console.error('❌ 刪除商品失敗：', err)
    return NextResponse.json(
      { success: false, message: '資料庫操作失敗' },
      { status: 500 }
    )
  }
}