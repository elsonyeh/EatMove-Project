import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const did = searchParams.get("did");

    if (!did) {
      return NextResponse.json(
        { success: false, message: "缺少外送員 ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      "SELECT did, dname, demail, dphonenumber, status FROM deliveryman WHERE did = $1",
      [did]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "找不到外送員資料" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error("獲取外送員資料失敗:", error);
    return NextResponse.json(
      { success: false, message: "獲取外送員資料失敗", error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const { did, status } = await req.json();

    if (!did) {
      return NextResponse.json(
        { success: false, message: "缺少外送員 ID" },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `UPDATE deliveryman 
       SET status = $1
       WHERE did = $2
       RETURNING did, dname, demail, dphonenumber, status`,
      [status, did]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "找不到外送員資料" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "外送員狀態更新成功",
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error("更新外送員狀態失敗:", error);
    return NextResponse.json(
      { success: false, message: "更新外送員狀態失敗", error: error.message },
      { status: 500 }
    );
  }
} 