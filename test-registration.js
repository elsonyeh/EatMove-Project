const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testRegistration() {
    try {
        console.log('===== 測試用戶註冊 =====')

        // 1. 測試會員註冊（無人臉辨識）
        const newMember = await prisma.member.create({
            data: {
                mid: `test_member_${Date.now()}`,
                name: '測試會員',
                address: '測試地址',
                phonenumber: '0912345678',
                email: `test${Date.now()}@example.com`,
                wallet: 0,
                face_descriptor: [] // 使用空陣列表示沒有人臉辨識
            }
        })
        console.log('會員註冊成功（無人臉辨識）:', newMember)

        // 1.1 測試會員註冊（有人臉辨識）
        const newMemberWithFace = await prisma.member.create({
            data: {
                mid: `test_member_face_${Date.now()}`,
                name: '測試會員（有人臉）',
                address: '測試地址',
                phonenumber: '0912345678',
                email: `test_face${Date.now()}@example.com`,
                wallet: 0,
                face_descriptor: [0.1, 0.2, 0.3] // 模擬人臉特徵數據
            }
        })
        console.log('會員註冊成功（有人臉辨識）:', newMemberWithFace)

        // 2. 測試餐廳註冊
        const newRestaurant = await prisma.restaurant.create({
            data: {
                rname: '測試餐廳',
                raddress: '測試地址',
                description: '測試描述',
                rphonenumber: '02-12345678',
                remail: `test${Date.now()}@restaurant.com`,
                rpassword: 'hashedPassword123',
                account: `testrestaurant_${Date.now()}`
            }
        })
        console.log('餐廳註冊成功:', newRestaurant)

        // 3. 測試外送員註冊
        const newDeliveryman = await prisma.deliveryman.create({
            data: {
                dname: '測試外送員',
                dphonenumber: '0987654321'
            }
        })
        console.log('外送員註冊成功:', newDeliveryman)

        // 4. 驗證註冊資料
        const verifyMember = await prisma.member.findUnique({
            where: { mid: newMember.mid }
        })
        console.log('驗證會員資料（無人臉）:', {
            exists: verifyMember !== null,
            hasFaceDescriptor: verifyMember?.face_descriptor?.length > 0
        })

        const verifyMemberWithFace = await prisma.member.findUnique({
            where: { mid: newMemberWithFace.mid }
        })
        console.log('驗證會員資料（有人臉）:', {
            exists: verifyMemberWithFace !== null,
            hasFaceDescriptor: verifyMemberWithFace?.face_descriptor?.length > 0,
            descriptorLength: verifyMemberWithFace?.face_descriptor?.length
        })

        const verifyRestaurant = await prisma.restaurant.findUnique({
            where: { rid: newRestaurant.rid }
        })
        console.log('驗證餐廳資料:', verifyRestaurant !== null)

        const verifyDeliveryman = await prisma.deliveryman.findUnique({
            where: { did: newDeliveryman.did }
        })
        console.log('驗證外送員資料:', verifyDeliveryman !== null)

        // 5. 清理測試資料
        console.log('\n===== 清理測試資料 =====')

        await prisma.member.delete({
            where: { mid: newMember.mid }
        })
        await prisma.member.delete({
            where: { mid: newMemberWithFace.mid }
        })
        await prisma.restaurant.delete({
            where: { rid: newRestaurant.rid }
        })
        await prisma.deliveryman.delete({
            where: { did: newDeliveryman.did }
        })

        console.log('測試資料清理完成')

    } catch (error) {
        console.error('測試過程中發生錯誤:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// 執行測試
testRegistration() 