import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import bcrypt from "bcrypt";

export async function PUT(req: Request) {
  try {
    const { userId, role, currentPassword, newPassword } = await req.json();

    if (!userId || !role || !currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    // 根據角色選擇對應的資料表和欄位
    const table = role === "member" ? "member" : "deliveryman";
    const idField = role === "member" ? "mid" : "did";
    const passwordField = role === "member" ? "password" : "dpassword";

    // 檢查當前密碼是否正確
    const userResult = await pool.query(
      `SELECT ${passwordField} FROM ${table} WHERE ${idField} = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "找不到用戶" },
        { status: 404 }
      );
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      userResult.rows[0][passwordField]
    );

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { success: false, message: "目前密碼不正確" },
        { status: 400 }
      );
    }

    // 雜湊新密碼
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密碼
    await pool.query(
      `UPDATE ${table} SET ${passwordField} = $1 WHERE ${idField} = $2`,
      [hashedNewPassword, userId]
    );

    return NextResponse.json({
      success: true,
      message: "密碼更新成功"
    });
  } catch (error: any) {
    console.error("更新密碼失敗:", error);
    return NextResponse.json(
      { success: false, message: "更新密碼失敗", error: error.message },
      { status: 500 }
    );
  }
} 