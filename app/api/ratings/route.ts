import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 提交評分
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { 
      oid, 
      uid, 
      rid, 
      did, 
      restaurantRating, 
      deliveryRating, 
      restaurantComment, 
      deliveryComment 
    } = body

    if (!oid || !uid || !rid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少必要的評分資訊" 
      }, { status: 400 })
    }

    // 檢查是否已經評分過
    const existingRating = await pool.query(
      "SELECT rating_id FROM ratings WHERE oid = $1 AND mid = $2",
      [oid, uid]
    )

    if (existingRating.rows.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: "此訂單已經評分過了" 
      }, { status: 400 })
    }

    // 開始交易
    await pool.query('BEGIN')

    try {
      // 插入評分記錄
      await pool.query(`
        INSERT INTO ratings (oid, mid, rid, did, restaurant_rating, delivery_rating, restaurant_comment, delivery_comment)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [oid, uid, rid, did, restaurantRating, deliveryRating, restaurantComment, deliveryComment])

      // 更新訂單的評分
      await pool.query(`
        UPDATE orders 
        SET restaurant_rating = $1, delivery_rating = $2
        WHERE oid = $3
      `, [restaurantRating, deliveryRating, oid])

      // 重新計算餐廳平均評分
      if (restaurantRating) {
        const avgResult = await pool.query(`
          SELECT AVG(restaurant_rating) as avg_rating
          FROM ratings 
          WHERE rid = $1 AND restaurant_rating IS NOT NULL
        `, [rid])

        const newAvgRating = parseFloat(avgResult.rows[0].avg_rating).toFixed(1)

        await pool.query(`
          UPDATE restaurant 
          SET rating = $1
          WHERE rid = $2
        `, [newAvgRating, rid])
      }

      // 提交交易
      await pool.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: "評分提交成功"
      })

    } catch (error) {
      // 回滾交易
      await pool.query('ROLLBACK')
      throw error
    }

  } catch (err: any) {
    console.error("❌ 提交評分失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "提交評分失敗", 
      error: err.message 
    }, { status: 500 })
  }
}

// 獲取評分列表
export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const rid = url.searchParams.get("rid")
    const did = url.searchParams.get("did")
    const uid = url.searchParams.get("uid")

    let query = `
      SELECT 
        r.*,
        m.name as member_name,
        rest.rname as restaurant_name,
        d.dname as delivery_name
      FROM ratings r
      LEFT JOIN member m ON r.mid = m.mid
      LEFT JOIN restaurant rest ON r.rid = rest.rid
      LEFT JOIN deliveryman d ON r.did = d.did
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (rid) {
      query += ` AND r.rid = $${paramIndex}`
      params.push(rid)
      paramIndex++
    }

    if (did) {
      query += ` AND r.did = $${paramIndex}`
      params.push(did)
      paramIndex++
    }

    if (uid) {
      query += ` AND r.mid = $${paramIndex}`
      params.push(uid)
      paramIndex++
    }

    query += ` ORDER BY r.created_at DESC`

    const result = await pool.query(query, params)

    return NextResponse.json({
      success: true,
      ratings: result.rows
    })

  } catch (err: any) {
    console.error("❌ 獲取評分失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "獲取評分失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 