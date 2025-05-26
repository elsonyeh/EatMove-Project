import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password, phonenumber, role, face_descriptor, plaintext } = await req.json();

    if (!name || !email || !password || !phonenumber || !role) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    // 檢查 email 是否已存在
    let checkEmailQuery;
    if (role === "member") {
      checkEmailQuery = "SELECT email FROM member WHERE email = $1";
    } else if (role === "deliveryman") {
      checkEmailQuery = "SELECT demail FROM deliveryman WHERE demail = $1";
    } else {
      return NextResponse.json(
        { success: false, message: "無效的角色類型" },
        { status: 400 }
      );
    }

    const existingUser = await pool.query(checkEmailQuery, [email]);
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

      // 使用明文密碼註冊會員
      result = await pool.query(
        `INSERT INTO member (mid, name, email, password, phonenumber, address, face_descriptor)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING mid, name, email, phonenumber, address`,
        [newMid, name, email, password, phonenumber, "暫時地址", face_descriptor]
      );
    } else if (role === "deliveryman") {
      // 使用明文密碼註冊外送員
      result = await pool.query(
        `INSERT INTO deliveryman (dname, demail, dpassword, dphonenumber, face_descriptor)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING did, dname as name, demail as email, dphonenumber as phonenumber`,
        [name, email, password, phonenumber, face_descriptor]
      );
    }

    return NextResponse.json({
      success: true,
      message: "註冊成功",
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error("註冊失敗:", error);
    return NextResponse.json(
      { success: false, message: "註冊失敗", error: error.message },
      { status: 500 }
    );
  }
} 