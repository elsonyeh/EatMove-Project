import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    let result;
    
    if (role === "member") {
      result = await pool.query(
        "SELECT mid as id FROM member WHERE email = $1",
        [email]
      );
    } else if (role === "deliveryman") {
      result = await pool.query(
        "SELECT did as id FROM deliveryman WHERE demail = $1",
        [email]
      );
    } else {
      return NextResponse.json(
        { success: false, message: "無效的角色類型" },
        { status: 400 }
      );
    }

    if (!result || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "找不到此用戶" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error("檢查用戶失敗:", error);
    return NextResponse.json(
      { success: false, message: "檢查用戶失敗", error: error.message },
      { status: 500 }
    );
  }
} 