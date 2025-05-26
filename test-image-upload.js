const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const prisma = new PrismaClient()

// 確保上傳目錄存在
const uploadDir = path.join(__dirname, 'uploads', 'menu-images')
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
}

/**
 * 處理圖片上傳
 * @param {Buffer} imageBuffer - 圖片的二進制數據
 * @param {string} originalFilename - 原始檔案名稱
 * @returns {Promise<string>} 儲存後的檔案路徑
 */
async function handleImageUpload(imageBuffer, originalFilename) {
    // 生成唯一的檔案名稱
    const fileExt = path.extname(originalFilename)
    const uniqueFilename = crypto.randomBytes(16).toString('hex') + fileExt
    const filePath = path.join(uploadDir, uniqueFilename)

    // 寫入檔案
    await fs.promises.writeFile(filePath, imageBuffer)

    // 返回相對路徑（用於資料庫儲存）
    return `/uploads/menu-images/${uniqueFilename}`
}

async function testImageUpload() {
    try {
        console.log('===== 測試餐點圖片上傳 =====')

        // 1. 建立測試餐廳
        const randomAccount = 'testrestaurant_' + Math.random().toString(36).substring(2, 15)
        const newRestaurant = await prisma.restaurant.create({
            data: {
                rname: '測試餐廳',
                raddress: '測試地址',
                description: '測試描述',
                rphonenumber: '02-12345678',
                remail: 'test@restaurant.com',
                rpassword: 'hashedPassword123',
                account: randomAccount
            }
        })
        console.log('建立餐廳成功:', newRestaurant)

        // 2. 模擬圖片上傳
        // 建立一個簡單的測試圖片（1x1 像素的 PNG）
        const testImageBuffer = Buffer.from([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
            0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
            0x0D, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0x64, 0x60, 0x60, 0x60,
            0x00, 0x00, 0x00, 0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00,
            0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
        ])

        const imagePath = await handleImageUpload(testImageBuffer, 'test-image.png')
        console.log('圖片上傳成功:', imagePath)

        // 3. 建立餐點（包含圖片路徑）
        const newMenuItem = await prisma.menu.create({
            data: {
                rid: newRestaurant.rid,
                dishid: 1,
                name: '測試餐點',
                price: 100.00,
                description: '測試餐點描述',
                image: imagePath,
                category: '主餐',
                isavailable: true,
                ispopular: false
            }
        })
        console.log('建立餐點成功:', newMenuItem)

        // 4. 查詢餐點及其圖片
        const menuItem = await prisma.menu.findUnique({
            where: {
                rid_dishid: {
                    rid: newRestaurant.rid,
                    dishid: newMenuItem.dishid
                }
            }
        })
        console.log('查詢餐點成功:', {
            ...menuItem,
            imageExists: fs.existsSync(path.join(__dirname, menuItem.image))
        })

        // 5. 更新餐點圖片
        const newImagePath = await handleImageUpload(testImageBuffer, 'updated-image.png')
        const updatedMenuItem = await prisma.menu.update({
            where: {
                rid_dishid: {
                    rid: newRestaurant.rid,
                    dishid: menuItem.dishid
                }
            },
            data: {
                image: newImagePath
            }
        })
        console.log('更新餐點圖片成功:', updatedMenuItem)

        // 6. 清理測試資料
        console.log('\n===== 清理測試資料 =====')

        // 刪除圖片檔案
        if (fs.existsSync(path.join(__dirname, menuItem.image))) {
            await fs.promises.unlink(path.join(__dirname, menuItem.image))
        }
        if (fs.existsSync(path.join(__dirname, newImagePath))) {
            await fs.promises.unlink(path.join(__dirname, newImagePath))
        }

        // 刪除資料庫記錄
        await prisma.menu.delete({
            where: {
                rid_dishid: {
                    rid: newRestaurant.rid,
                    dishid: menuItem.dishid
                }
            }
        })
        await prisma.restaurant.delete({ where: { rid: newRestaurant.rid } })

        console.log('測試資料清理完成')

    } catch (error) {
        console.error('測試過程中發生錯誤:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// 執行測試
testImageUpload() 