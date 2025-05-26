import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { userId, role, faceDescriptor } = await req.json();

    if (!userId || !role || !faceDescriptor) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    let result;
    if (role === "member") {
      result = await pool.query(
        `UPDATE member 
         SET face_descriptor = $1
         WHERE mid = $2
         RETURNING mid, name, email, face_descriptor`,
        [faceDescriptor, userId]
      );
    } else if (role === "deliveryman") {
      result = await pool.query(
        `UPDATE deliveryman 
         SET face_descriptor = $1
         WHERE did = $2
         RETURNING did, dname, demail, face_descriptor`,
        [faceDescriptor, userId]
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
      message: "人臉特徵註冊成功",
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error("人臉特徵註冊失敗:", error);
    return NextResponse.json(
      { success: false, message: "人臉特徵註冊失敗", error: error.message },
      { status: 500 }
    );
  }
} 