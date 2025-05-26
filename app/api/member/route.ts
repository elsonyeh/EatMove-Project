import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { role, account, name, email, password, phonenumber, address, description } = await req.json();

    console.log("📥 收到前端傳來資料:", { role, account, name, email, password, phonenumber, address, description });

    // 基本資料驗證
    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    if (role === "member") {
      try {
        // 檢查郵箱是否已存在
        const existingUser = await pool.query(
          "SELECT * FROM member WHERE email = $1",
          [email]
        );

        if (existingUser.rows.length > 0) {
          return NextResponse.json(
            { success: false, message: "此郵箱已被註冊" },
            { status: 400 }
          );
        }

        // 生成唯一的會員ID
        const memberIdResult = await pool.query(`
          SELECT CONCAT('M', 
            TO_CHAR(
              COALESCE(
                (SELECT MAX(CAST(SUBSTRING(mid FROM 2) AS INTEGER)) FROM member), 
                0
              ) + 1, 
              'FM000000'
            )
          ) as new_mid
        `);
        const newMemberId = memberIdResult.rows[0].new_mid;

        const result = await pool.query(
          `INSERT INTO member (mid, name, email, password, phonenumber, address, createtime, wallet, face_descriptor)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), 0, $7)
           RETURNING *`,
          [newMemberId, name, email, password, phonenumber || "", address || "", []]
        );
        
        console.log("✅ 成功寫入 member:", result.rows[0]);
        return NextResponse.json({ 
          success: true, 
          message: "✅ 會員註冊成功",
          data: {
            ...result.rows[0],
            password: undefined // 不回傳密碼
          }
        });
      } catch (dbError: any) {
        console.error("❌ 資料庫操作錯誤:", dbError);
        return NextResponse.json({ 
          success: false, 
          message: dbError.code === "23505" ? "此帳號已被註冊" : "資料庫操作失敗",
          error: dbError.message 
        }, { status: 500 });
      }
    } else if (role === "restaurant") {
      try {
        // 檢查餐廳帳號是否已存在
        const existingRestaurant = await pool.query(
          "SELECT * FROM restaurant WHERE account = $1 OR remail = $2",
          [account, email]
        );

        if (existingRestaurant.rows.length > 0) {
          return NextResponse.json(
            { success: false, message: "此帳號或郵箱已被註冊" },
            { status: 400 }
          );
        }

        const result = await pool.query(
          `INSERT INTO restaurant (account, rname, raddress, description, rphonenumber, remail, rpassword)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [account, name, address || "", description || "", phonenumber, email, password]
        );
        
        console.log("✅ 成功寫入 restaurant:", result.rows[0]);
        return NextResponse.json({ 
          success: true, 
          message: "✅ 餐廳註冊成功",
          data: {
            ...result.rows[0],
            rpassword: undefined // 不回傳密碼
          }
        });
      } catch (dbError: any) {
        console.error("❌ 資料庫操作錯誤:", dbError);
        return NextResponse.json({ 
          success: false, 
          message: dbError.code === "23505" ? "此帳號已被註冊" : "資料庫操作失敗",
          error: dbError.message 
        }, { status: 500 });
      }
    } else if (role === "deliveryman") {
      try {
        // 檢查外送員帳號是否已存在
        const existingDeliveryman = await pool.query(
          "SELECT * FROM deliveryman WHERE dphonenumber = $1",
          [phonenumber]
        );

        if (existingDeliveryman.rows.length > 0) {
          return NextResponse.json(
            { success: false, message: "此電話號碼已被註冊" },
            { status: 400 }
          );
        }

        const result = await pool.query(
          `INSERT INTO deliveryman (dname, dphonenumber, dpassword, demail)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [name, phonenumber, password, email]
        );
        
        console.log("✅ 成功寫入 deliveryman:", result.rows[0]);
        return NextResponse.json({ 
          success: true, 
          message: "✅ 外送員註冊成功",
          data: {
            ...result.rows[0],
            dpassword: undefined // 不回傳密碼
          }
        });
      } catch (dbError: any) {
        console.error("❌ 資料庫操作錯誤:", dbError);
        return NextResponse.json({ 
          success: false, 
          message: dbError.code === "23505" ? "此帳號已被註冊" : "資料庫操作失敗",
          error: dbError.message 
        }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        { success: false, message: "❌ 無效的角色類型" },
        { status: 400 }
      );
    }
  } catch (err: any) {
    console.error("❌ 註冊錯誤:", err);
    return NextResponse.json(
      { success: false, message: "❌ 註冊失敗", error: err.message },
      { status: 500 }
    );
  }
}
