import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'

// 儲存人臉特徵
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, role, faceDescriptor } = body

    if (!userId || !role || !faceDescriptor || !Array.isArray(faceDescriptor)) {
      return NextResponse.json(
        { success: false, message: "無效的請求資料" },
        { status: 400 }
      )
    }

    let result;
    if (role === 'member') {
      result = await pool.query(
        `UPDATE member SET face_descriptor = $1 WHERE mid = $2 RETURNING *`,
        [faceDescriptor, userId]
      );
    } else if (role === 'deliveryman') {
      result = await pool.query(
        `UPDATE deliveryman SET face_descriptor = $1 WHERE did = $2 RETURNING *`,
        [faceDescriptor, userId]
      );
    } else {
      return NextResponse.json(
        { success: false, message: "無效的角色類型" },
        { status: 400 }
      )
    }

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "找不到指定的用戶" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "成功儲存人臉特徵",
      data: result.rows[0]
    })
  } catch (error: any) {
    console.error("儲存人臉特徵時發生錯誤:", error)
    return NextResponse.json(
      {
        success: false,
        message: "儲存人臉特徵時發生錯誤",
        error: error.message,
      },
      { status: 500 }
    )
  }
}

// 取得使用者的人臉特徵
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, message: "缺少必要參數" },
        { status: 400 }
      )
    }

    let result;
    if (role === 'member') {
      result = await pool.query(
        `SELECT face_descriptor FROM member WHERE mid = $1`,
        [userId]
      );
    } else if (role === 'deliveryman') {
      result = await pool.query(
        `SELECT face_descriptor FROM deliveryman WHERE did = $1`,
        [userId]
      );
    } else {
      return NextResponse.json(
        { success: false, message: "無效的角色類型" },
        { status: 400 }
      )
    }

    if (result.rows.length === 0 || !result.rows[0].face_descriptor) {
      return NextResponse.json(
        { success: false, message: "找不到人臉特徵資料" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        faceDescriptor: result.rows[0].face_descriptor
      }
    })
  } catch (error: any) {
    console.error("讀取人臉特徵時發生錯誤:", error)
    return NextResponse.json(
      {
        success: false,
        message: "讀取人臉特徵時發生錯誤",
        error: error.message,
      },
      { status: 500 }
    )
  }
} 