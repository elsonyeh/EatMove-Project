import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function GET() {
  try {
    const result = await sql`SELECT NOW()`;
    return NextResponse.json({ success: true, now: result.rows[0] });
  } catch (err) {
    console.error("❌ 資料庫連線失敗", err);
    return NextResponse.json({ success: false, message: "連線錯誤" }, { st 500 });
  }
}
