import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 獲取用戶資料
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const role = searchParams.get("role");

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, message: "缺少必要參數" },
        { status: 400 }
      );
    }

    let result;
    if (role === "member") {
      result = await pool.query(
        "SELECT mid, name, email, phonenumber, address, face_descriptor FROM member WHERE mid = $1",
        [userId]
      );
    } else if (role === "deliveryman") {
      result = await pool.query(
        "SELECT did, dname, demail, dphonenumber, face_descriptor FROM deliveryman WHERE did = $1",
        [userId]
      );
    } else {
      return NextResponse.json(
        { success: false, message: "無效的角色類型" },
        { status: 400 }
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "找不到用戶" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error("獲取用戶資料失敗:", error);
    return NextResponse.json(
      { success: false, message: "獲取用戶資料失敗", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { userId, role, name, email, phonenumber, address } = await req.json();

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    let result;
    if (role === "member") {
      // 檢查 email 是否已被其他用戶使用
      if (email) {
        const emailCheck = await pool.query(
          "SELECT mid FROM member WHERE email = $1 AND mid != $2",
          [email, userId]
        );
        if (emailCheck.rows.length > 0) {
          return NextResponse.json(
            { success: false, message: "此電子郵件已被使用" },
            { status: 400 }
          );
        }
      }

      result = await pool.query(
        `UPDATE member 
         SET name = COALESCE($1, name),
             email = COALESCE($2, email),
             phonenumber = COALESCE($3, phonenumber),
             address = COALESCE($4, address)
         WHERE mid = $5
         RETURNING mid, name, email, phonenumber, address`,
        [name, email, phonenumber, address, userId]
      );
    } else if (role === "deliveryman") {
      // 檢查 email 是否已被其他外送員使用
      if (email) {
        const emailCheck = await pool.query(
          "SELECT did FROM deliveryman WHERE demail = $1 AND did != $2",
          [email, userId]
        );
        if (emailCheck.rows.length > 0) {
          return NextResponse.json(
            { success: false, message: "此電子郵件已被使用" },
            { status: 400 }
          );
        }
      }

      result = await pool.query(
        `UPDATE deliveryman 
         SET dname = COALESCE($1, dname),
             demail = COALESCE($2, demail),
             dphonenumber = COALESCE($3, dphonenumber)
         WHERE did = $4
         RETURNING did, dname, demail, dphonenumber`,
        [name, email, phonenumber, userId]
      );
    } else {
      return NextResponse.json(
        { success: false, message: "無效的角色類型" },
        { status: 400 }
      );
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "找不到用戶" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "個人資料更新成功",
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error("更新個人資料失敗:", error);
    return NextResponse.json(
      { success: false, message: "更新個人資料失敗", error: error.message },
      { status: 500 }
    );
  }
} 