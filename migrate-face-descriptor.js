const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
    user: 'postgres',
    password: 'YCaWNvWdsQubMRAgKExnVNtPCJMqXZXE',
    host: 'nozomi.proxy.rlwy.net',
    port: 25558,
    database: 'railway',
    ssl: {
        rejectUnauthorized: false
    }
})

const migrateFaceDescriptor = async () => {
    try {
        await client.connect()

        // 1. 先將現有的人臉特徵資料遷移到 member 表格
        await client.query(`
      -- 添加 face_descriptor 欄位到 member 表格
      ALTER TABLE "member" ADD COLUMN IF NOT EXISTS face_descriptor FLOAT[];
      
      -- 將現有的人臉特徵資料遷移到 member 表格
      UPDATE "member" m
      SET face_descriptor = fd.descriptor
      FROM "FaceDescriptor" fd
      WHERE m.mid = fd."memberId";
      
      -- 刪除舊的 FaceDescriptor 表格
      DROP TABLE IF EXISTS "FaceDescriptor";
    `)

        console.log('成功將人臉特徵整合到 member 表格')

        // 確認遷移結果
        const result = await client.query(`
      SELECT mid, face_descriptor 
      FROM "member" 
      WHERE face_descriptor IS NOT NULL;
    `)

        console.log('已遷移的資料數量:', result.rows.length)
        if (result.rows.length > 0) {
            console.log('範例資料:', {
                memberId: result.rows[0].mid,
                hasDescriptor: result.rows[0].face_descriptor !== null,
                descriptorLength: result.rows[0].face_descriptor?.length
            })
        }

    } catch (error) {
        console.error('遷移過程中發生錯誤:', error)
    } finally {
        await client.end()
    }
}

migrateFaceDescriptor()

// 在刪除餐廳前檢查相關資料
const deleteRestaurant = async (rid) => {
    const relatedData = await prisma.$transaction([
        prisma.menu.findMany({ where: { rid } }),
        prisma.order.findMany({ where: { rid } }),
    ]);

    // 如果有相關資料，先處理它們
    if (relatedData[0].length > 0 || relatedData[1].length > 0) {
        // 刪除相關圖片
        for (const menuItem of relatedData[0]) {
            if (menuItem.image) {
                // 刪除圖片檔案
            }
        }
    }
}; 