import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { pool } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const rid = formData.get('rid') as string

    if (!file) {
      return NextResponse.json({ 
        success: false, 
        message: "沒有選擇檔案" 
      }, { status: 400 })
    }

    if (!rid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少餐廳ID" 
      }, { status: 400 })
    }

    // 檢查檔案類型
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ 
        success: false, 
        message: "檔案必須是圖片格式" 
      }, { status: 400 })
    }

    // 檢查檔案大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ 
        success: false, 
        message: "檔案大小不能超過 5MB" 
      }, { status: 400 })
    }

    // 生成檔案名稱
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `${rid}_${type}_${timestamp}.${fileExtension}`

    // 確保上傳目錄存在
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'restaurants')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // 目錄已存在，忽略錯誤
    }

    // 儲存檔案
    const filePath = join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // 生成可訪問的URL
    const imageUrl = `/uploads/restaurants/${fileName}`

    // 更新資料庫中的圖片路徑
    await pool.query(
      `UPDATE restaurant SET image = $1 WHERE rid = $2`,
      [imageUrl, rid]
    )

    return NextResponse.json({
      success: true,
      message: "圖片上傳成功",
      imageUrl: imageUrl
    })

  } catch (err: any) {
    console.error("❌ 圖片上傳失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "圖片上傳失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 