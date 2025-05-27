import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

// 提交評分
export async function POST(req: Request) {
  try {
    const body = await req.json()
    console.log("📝 收到評分數據:", body)
    
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
      console.log("❌ 缺少必要參數:", { oid, uid, rid })
      return NextResponse.json({ 
        success: false, 
        message: "缺少必要的評分資訊" 
      }, { status: 400 })
    }

    console.log("🔍 檢查評分參數:", {
      oid, uid, rid, did, restaurantRating, deliveryRating
    })

    // 檢查訂單是否存在且屬於該用戶
    const orderCheck = await pool.query(
      "SELECT oid, mid, rid, status FROM orders WHERE oid = $1 AND mid = $2",
      [oid, uid]
    )

    if (orderCheck.rows.length === 0) {
      console.log("❌ 訂單不存在或不屬於該用戶:", { oid, uid })
      return NextResponse.json({ 
        success: false, 
        message: "找不到該訂單或訂單不屬於您" 
      }, { status: 404 })
    }

    const order = orderCheck.rows[0]
    console.log("📋 找到訂單:", order)

    // 檢查是否已經評分過
    const existingRating = await pool.query(
      "SELECT rating_id FROM ratings WHERE oid = $1 AND mid = $2",
      [oid, uid]
    )

    if (existingRating.rows.length > 0) {
      console.log("❌ 訂單已評分:", existingRating.rows[0])
      return NextResponse.json({ 
        success: false, 
        message: "此訂單已經評分過了" 
      }, { status: 400 })
    }

    // 開始交易
    await pool.query('BEGIN')
    console.log("🔄 開始數據庫交易")

    try {
      // 插入評分記錄
      const insertResult = await pool.query(`
        INSERT INTO ratings (oid, mid, rid, did, restaurant_rating, delivery_rating, restaurant_comment, delivery_comment)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING rating_id
      `, [oid, uid, rid, did || null, restaurantRating, deliveryRating, restaurantComment || '', deliveryComment || ''])

      const ratingId = insertResult.rows[0].rating_id
      console.log("✅ 評分記錄插入成功，ID:", ratingId)

      // 更新訂單的評分
      const updateResult = await pool.query(`
        UPDATE orders 
        SET restaurant_rating = $1, delivery_rating = $2
        WHERE oid = $3
      `, [restaurantRating, deliveryRating, oid])

      console.log("✅ 訂單評分更新成功，影響行數:", updateResult.rowCount)

      // 重新計算餐廳平均評分
      if (restaurantRating && restaurantRating > 0) {
        const avgResult = await pool.query(`
          SELECT AVG(restaurant_rating) as avg_rating, COUNT(*) as total_ratings
          FROM ratings 
          WHERE rid = $1 AND restaurant_rating IS NOT NULL AND restaurant_rating > 0
        `, [rid])

        const avgRating = avgResult.rows[0].avg_rating
        const totalRatings = avgResult.rows[0].total_ratings
        const newAvgRating = Math.round(avgRating * 10) / 10 // 四捨五入到小數點後一位

        const restaurantUpdateResult = await pool.query(`
          UPDATE restaurant 
          SET rating = $1
          WHERE rid = $2
        `, [newAvgRating, rid])

        console.log(`✅ 餐廳平均評分更新成功: ${newAvgRating} (基於 ${totalRatings} 個評分)`)
      }

      // 提交交易
      await pool.query('COMMIT')
      console.log("✅ 數據庫交易提交成功")

      return NextResponse.json({
        success: true,
        message: "評分提交成功",
        ratingId: ratingId
      })

    } catch (error) {
      // 回滾交易
      await pool.query('ROLLBACK')
      console.log("❌ 數據庫交易回滾")
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