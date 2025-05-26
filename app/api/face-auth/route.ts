import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 儲存人臉特徵
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, faceDescriptor } = body

    if (!userId || !faceDescriptor || !Array.isArray(faceDescriptor)) {
      return NextResponse.json(
        { success: false, message: "無效的請求資料" },
        { status: 400 }
      )
    }

    // 儲存或更新人臉特徵
    const result = await prisma.faceDescriptor.upsert({
      where: {
        userId: userId,
      },
      update: {
        descriptor: faceDescriptor,
      },
      create: {
        userId: userId,
        descriptor: faceDescriptor,
      },
    })

    return NextResponse.json({
      success: true,
      message: "成功儲存人臉特徵",
      data: result,
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

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "缺少使用者 ID" },
        { status: 400 }
      )
    }

    const faceDescriptor = await prisma.faceDescriptor.findUnique({
      where: {
        userId: parseInt(userId),
      },
    })

    if (!faceDescriptor) {
      return NextResponse.json(
        { success: false, message: "找不到人臉特徵資料" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: faceDescriptor,
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