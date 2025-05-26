import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { username, password, role } = await req.json();

    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    let result;
    
    if (role === "user") {
      // 查詢會員資料（使用 email 作為登入帳號）
      result = await pool.query(
        "SELECT mid, name, email, password, phonenumber, address, wallet FROM member WHERE email = $1",
        [username]
      );
    } else if (role === "delivery") {
      // 查詢外送員資料
      result = await pool.query(
        "SELECT did as mid, dname as name, demail as email, dpassword as password, dphonenumber as phonenumber FROM deliveryman WHERE demail = $1",
        [username]
      );
    }

    if (!result || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "帳號或密碼錯誤" },
        { status: 401 }
      );
    }

    // 驗證密碼
    const user = result.rows[0];
    if (user.password !== password) {
      return NextResponse.json(
        { success: false, message: "帳號或密碼錯誤" },
        { status: 401 }
      );
    }

    // 移除密碼後回傳用戶資料
    const { password: _, ...userData } = user;
    return NextResponse.json({
      success: true,
      data: userData
    });
  } catch (error: any) {
    console.error("登入失敗:", error);
    return NextResponse.json(
      { success: false, message: "登入失敗", error: error.message },
      { status: 500 }
    );
  }
} 