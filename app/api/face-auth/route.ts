import { NextResponse } from 'next/server'
import { sql } from '@vercel/postgres'

// 儲存人臉特徵
export async function POST(request: Request) {
  try {
    const { userId, faceDescriptor } = await request.json()

    // 將人臉特徵儲存到資料庫
    await sql`
      INSERT INTO face_auth (user_id, face_descriptor)
      VALUES (${userId}, ${JSON.stringify(faceDescriptor)})
      ON CONFLICT (user_id) 
      DO UPDATE SET face_descriptor = ${JSON.stringify(faceDescriptor)}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving face descriptor:', error)
    return NextResponse.json(
      { error: '儲存人臉特徵時發生錯誤' },
      { status: 500 }
    )
  }
}

// 取得使用者的人臉特徵
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: '缺少使用者 ID' },
        { status: 400 }
      )
    }

    const result = await sql`
      SELECT face_descriptor
      FROM face_auth
      WHERE user_id = ${userId}
    `

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: '找不到使用者的人臉特徵' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      faceDescriptor: JSON.parse(result.rows[0].face_descriptor)
    })
  } catch (error) {
    console.error('Error getting face descriptor:', error)
    return NextResponse.json(
      { error: '取得人臉特徵時發生錯誤' },
      { status: 500 }
    )
  }
} 