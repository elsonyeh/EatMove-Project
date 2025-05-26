const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testFaceStorage() {
    try {
        // 1. 先檢查是否有測試用的會員
        const testMemberId = 'TEST001'
        let member = await prisma.member.findUnique({
            where: { mid: testMemberId }
        })

        // 如果會員不存在，建立一個測試會員
        if (!member) {
            member = await prisma.member.create({
                data: {
                    mid: testMemberId,
                    name: '測試用戶',
                    email: 'test@example.com',
                    phonenumber: '0912345678',
                    face_descriptor: Array(128).fill(0).map(() => Math.random())
                }
            })
            console.log('建立測試會員:', member)
        } else {
            // 更新現有會員的人臉特徵
            member = await prisma.member.update({
                where: { mid: testMemberId },
                data: {
                    face_descriptor: Array(128).fill(0).map(() => Math.random())
                }
            })
            console.log('更新會員人臉特徵:', {
                mid: member.mid,
                descriptorLength: member.face_descriptor.length,
                descriptorSample: member.face_descriptor.slice(0, 5)
            })
        }

        // 讀取並驗證儲存的資料
        const savedMember = await prisma.member.findUnique({
            where: { mid: testMemberId }
        })

        console.log('讀取儲存的人臉特徵:', {
            mid: savedMember.mid,
            descriptorLength: savedMember.face_descriptor.length,
            descriptorSample: savedMember.face_descriptor.slice(0, 5),
            updatedAt: savedMember.createtime
        })

    } catch (error) {
        console.error('測試過程中發生錯誤:', error)
    } finally {
        await prisma.$disconnect()
    }
}

testFaceStorage() 