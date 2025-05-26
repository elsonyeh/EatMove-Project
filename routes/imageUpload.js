const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// 設定 multer 儲存選項
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '..', 'uploads', 'menu-images')
        // 確保目錄存在
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true })
        }
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // 生成唯一檔名
        const uniqueSuffix = crypto.randomBytes(16).toString('hex')
        cb(null, uniqueSuffix + path.extname(file.originalname))
    }
})

// 檔案過濾器
const fileFilter = (req, file, cb) => {
    // 只允許圖片檔案
    if (file.mimetype.startsWith('image/')) {
        cb(null, true)
    } else {
        cb(new Error('只允許上傳圖片檔案！'), false)
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 限制 5MB
    }
})

// 上傳單一圖片
router.post('/menu-image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '沒有上傳檔案' })
        }

        const imagePath = `/uploads/menu-images/${req.file.filename}`

        // 如果有提供 menuId，更新對應的菜單項目
        if (req.body.rid && req.body.dishid) {
            await prisma.menu.update({
                where: {
                    rid_dishid: {
                        rid: parseInt(req.body.rid),
                        dishid: parseInt(req.body.dishid)
                    }
                },
                data: {
                    image: imagePath
                }
            })
        }

        res.json({
            success: true,
            path: imagePath,
            message: '圖片上傳成功'
        })
    } catch (error) {
        console.error('圖片上傳錯誤:', error)
        res.status(500).json({ error: '圖片上傳失敗' })
    }
})

// 刪除圖片
router.delete('/menu-image/:filename', async (req, res) => {
    try {
        const filename = req.params.filename
        const filepath = path.join(__dirname, '..', 'uploads', 'menu-images', filename)

        if (fs.existsSync(filepath)) {
            await fs.promises.unlink(filepath)
            res.json({ success: true, message: '圖片刪除成功' })
        } else {
            res.status(404).json({ error: '圖片不存在' })
        }
    } catch (error) {
        console.error('圖片刪除錯誤:', error)
        res.status(500).json({ error: '圖片刪除失敗' })
    }
})

module.exports = router 