import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const { role, name, email, password, phonenumber, address, description } = await req.json();

    if (!role || !name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    // 雜湊密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    if (role === "member" || role === "deliveryman") {
      try {
        // 檢查 email 是否已存在
        const table = role === "member" ? "member" : "deliveryman";
        const emailField = role === "member" ? "email" : "demail";
        const existingUser = await pool.query(
          `SELECT * FROM ${table} WHERE ${emailField} = $1`,
          [email]
        );

        if (existingUser.rows.length > 0) {
          return NextResponse.json(
            { success: false, message: "此電子郵件已被使用" },
            { status: 400 }
          );
        }

        let result;
        if (role === "member") {
          // 生成會員 ID (MID)
          const midResult = await pool.query(
            "SELECT mid FROM member ORDER BY mid DESC LIMIT 1"
          );
          const lastMid = midResult.rows[0]?.mid || "M000000";
          const newMidNumber = parseInt(lastMid.substring(1)) + 1;
          const newMid = `M${newMidNumber.toString().padStart(6, "0")}`;

          result = await pool.query(
            `INSERT INTO member (mid, name, email, password, phonenumber, address)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING mid, name, email, phonenumber, address`,
            [newMid, name, email, hashedPassword, phonenumber, address]
          );
        } else {
          result = await pool.query(
            `INSERT INTO deliveryman (dname, demail, dpassword, dphonenumber)
             VALUES ($1, $2, $3, $4)
             RETURNING did, dname, demail, dphonenumber`,
            [name, email, hashedPassword, phonenumber]
          );
        }

        console.log(`✅ 成功寫入 ${role}:`, result.rows[0]);
        return NextResponse.json({
          success: true,
          message: `✅ ${role === "member" ? "會員" : "外送員"}註冊成功`,
          data: result.rows[0]
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
        // 檢查餐廳郵箱是否已存在
        const existingRestaurant = await pool.query(
          "SELECT * FROM restaurant WHERE remail = $1",
          [email]
        );

        if (existingRestaurant.rows.length > 0) {
          return NextResponse.json(
            { success: false, message: "此電子郵件已被使用" },
            { status: 400 }
          );
        }

        const result = await pool.query(
          `INSERT INTO restaurant (rname, raddress, description, rphonenumber, remail, rpassword)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING rid, rname, remail, rphonenumber, raddress`,
          [name, address, description, phonenumber, email, hashedPassword]
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
    } else {
      return NextResponse.json(
        { success: false, message: "無效的角色類型" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ 註冊失敗:", error);
    return NextResponse.json(
      { success: false, message: "註冊失敗", error: error.message },
      { status: 500 }
    );
  }
}
