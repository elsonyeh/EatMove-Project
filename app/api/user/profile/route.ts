import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

// 獲取用戶資料
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mid = searchParams.get("mid");

    if (!mid) {
      return NextResponse.json(
        { success: false, message: "缺少用戶 ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "SELECT mid, name, email, phonenumber, address, wallet FROM member WHERE mid = $1",
      [mid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "找不到用戶資料" },
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

// 更新用戶資料
export async function PUT(req: Request) {
  try {
    const { mid, name, email, phonenumber, address } = await req.json();

    if (!mid) {
      return NextResponse.json(
        { success: false, message: "缺少用戶 ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE member 
       SET name = $1, email = $2, phonenumber = $3, address = $4
       WHERE mid = $5
       RETURNING mid, name, email, phonenumber, address, wallet`,
      [name, email, phonenumber, address, mid]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "找不到用戶資料" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "用戶資料更新成功",
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error("更新用戶資料失敗:", error);
    return NextResponse.json(
      { success: false, message: "更新用戶資料失敗", error: error.message },
      { status: 500 }
    );
  }
} 