import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST() {
  try {
    // 創建測試用戶
    const testUsers = [
      {
        name: "王小明",
        email: "wang@example.com",
        phone: "0912345678",
        address: "高雄市前金區中正四路211號"
      },
      {
        name: "李小華",
        email: "lee@example.com", 
        phone: "0923456789",
        address: "高雄市苓雅區四維三路2號"
      },
      {
        name: "陳小美",
        email: "chen@example.com",
        phone: "0934567890", 
        address: "高雄市新興區中山一路115號"
      }
    ]

    // 創建測試外送員
    const testDeliverymen = [
      {
        dname: "張外送",
        demail: "zhang@delivery.com",
        dphonenumber: "0945678901"
      },
      {
        dname: "劉快遞",
        demail: "liu@delivery.com", 
        dphonenumber: "0956789012"
      },
      {
        dname: "黃速達",
        demail: "huang@delivery.com",
        dphonenumber: "0967890123"
      }
    ]

    let userResults = []
    let deliveryResults = []

    // 插入測試用戶
    for (const user of testUsers) {
      try {
        const result = await pool.query(`
          INSERT INTO member (name, email, phone, address)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email) DO UPDATE SET
            name = EXCLUDED.name,
            phone = EXCLUDED.phone,
            address = EXCLUDED.address
          RETURNING uid, name, email
        `, [user.name, user.email, user.phone, user.address])
        
        userResults.push(result.rows[0])
      } catch (error) {
        console.error(`插入用戶 ${user.name} 失敗:`, error)
      }
    }

    // 插入測試外送員
    for (const delivery of testDeliverymen) {
      try {
        const result = await pool.query(`
          INSERT INTO deliveryman (dname, demail, dphonenumber)
          VALUES ($1, $2, $3)
          ON CONFLICT (demail) DO UPDATE SET
            dname = EXCLUDED.dname,
            dphonenumber = EXCLUDED.dphonenumber
          RETURNING did, dname, demail
        `, [delivery.dname, delivery.demail, delivery.dphonenumber])
        
        deliveryResults.push(result.rows[0])
      } catch (error) {
        console.error(`插入外送員 ${delivery.dname} 失敗:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: "測試資料創建成功",
      users: userResults,
      deliverymen: deliveryResults
    })

  } catch (err: any) {
    console.error("❌ 創建測試資料失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "創建測試資料失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 