import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const restaurantId = params.id

    const result = await pool.query(
      'SELECT * FROM restaurants WHERE id = $1',
      [restaurantId]
    )

    if (result.rowCount === 0) {
      return NextResponse.json(
        { success: false, message: '找不到餐廳' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      restaurant: result.rows[0],
    })
  } catch (err: any) {
    console.error('❌ 查詢餐廳失敗：', err)
    return NextResponse.json(
      { success: false, message: '資料庫錯誤', error: err.message },
      { status: 500 }
    )
  }
}
