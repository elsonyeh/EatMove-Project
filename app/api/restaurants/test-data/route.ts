import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST() {
  try {
    // 刪除所有測試餐廳資料
    const deleteMenuResult = await pool.query(
      `DELETE FROM menu WHERE rid IN (
        SELECT rid FROM restaurant WHERE account IN (
          'jinghua_restaurant', 'fujii_sushi', 'seoul_star', 'roma_kitchen', 'american_burger'
        )
      )`
    )

    const deleteRestaurantResult = await pool.query(
      `DELETE FROM restaurant WHERE account IN (
        'jinghua_restaurant', 'fujii_sushi', 'seoul_star', 'roma_kitchen', 'american_burger'
      )`
    )

    // 更新所有現有餐廳的外送地區為高雄市
    const updateDeliveryAreaResult = await pool.query(
      `UPDATE restaurant SET delivery_area = '高雄市' WHERE delivery_area IS NOT NULL`
    )

    return NextResponse.json({
      success: true,
      message: "測試資料已刪除，外送地區已更新為高雄市",
      deletedMenuItems: deleteMenuResult.rowCount,
      deletedRestaurants: deleteRestaurantResult.rowCount,
      updatedRestaurants: updateDeliveryAreaResult.rowCount
    })

  } catch (err: any) {
    console.error("❌ 刪除測試資料失敗：", err)
    return NextResponse.json({
      success: false,
      message: "刪除測試資料失敗",
      error: err.message
    }, { status: 500 })
  }
} 