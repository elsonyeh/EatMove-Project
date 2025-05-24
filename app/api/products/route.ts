import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const rid = url.searchParams.get("rid")

    if (!rid) {
      return NextResponse.json({ success: false, message: "缺少餐廳ID (rid)" }, { status: 400 })
    }

    const result = await pool.query("SELECT * FROM menu WHERE rid = $1", [rid])

    return NextResponse.json({ success: true, items: result.rows })
  } catch (err: any) {
    console.error("❌ 讀取商品失敗：", err)
    return NextResponse.json({ success: false, message: "資料庫讀取失敗", error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { rid, dishid, price, description, image, name, category, isavailable, ispopular } = await req.json()

    if (!rid || !dishid || !price || !name) {
      return NextResponse.json({ success: false, message: "缺少必要欄位 rid, dishid, price, name" }, { status: 400 })
    }

    const result = await pool.query(
      `INSERT INTO menu (rid, dishid, price, description, image, name, category, isavailable, ispopular)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [rid, dishid, price, description || "", image || "", name, category || "", isavailable !== undefined ? isavailable : true, ispopular !== undefined ? ispopular : false]
    )

    return NextResponse.json({ success: true, item: result.rows[0] })
  } catch (err: any) {
    console.error("❌ 新增商品失敗：", err)
    return NextResponse.json({ success: false, message: "資料庫寫入失敗", error: err.message }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const { rid, dishid, price, description, image, name, category, isavailable } = await req.json()

    if (!rid || !dishid) {
      return NextResponse.json({ success: false, message: "缺少 rid 或 dishid" }, { status: 400 })
    }

    const result = await pool.query(
      `UPDATE menu SET price = $1, description = $2, image = $3, name = $4, category = $5, isavailable = $6
       WHERE rid = $7 AND dishid = $8 RETURNING *`,
      [price, description, image, name, category, isavailable, rid, dishid]
    )

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: "找不到對應商品" }, { status: 404 })
    }

    return NextResponse.json({ success: true, item: result.rows[0] })
  } catch (err: any) {
    console.error("❌ 更新商品失敗：", err)
    return NextResponse.json({ success: false, message: "資料庫更新失敗", error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { rid, dishid } = await req.json()

    if (!rid || !dishid) {
      return NextResponse.json({ success: false, message: "缺少 rid 或 dishid" }, { status: 400 })
    }

    const result = await pool.query("DELETE FROM menu WHERE rid = $1 AND dishid = $2 RETURNING *", [rid, dishid])

    if (result.rowCount === 0) {
      return NextResponse.json({ success: false, message: "找不到對應商品" }, { status: 404 })
    }

    return NextResponse.json({ success: true, deleted: result.rows[0] })
  } catch (err: any) {
    console.error("❌ 刪除商品失敗：", err)
    return NextResponse.json({ success: false, message: "資料庫操作失敗", error: err.message }, { status: 500 })
  }
}
