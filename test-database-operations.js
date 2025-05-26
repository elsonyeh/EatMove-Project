const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testDatabaseOperations() {
    try {
        console.log('===== 1. 測試外送員（Deliveryman）操作 =====')

        // 建立外送員
        const newDeliveryman = await prisma.deliveryman.create({
            data: {
                dname: '測試外送員',
                dphonenumber: '0912345678'
            }
        })
        console.log('建立外送員成功:', newDeliveryman)

        // 查詢外送員
        const deliveryman = await prisma.deliveryman.findUnique({
            where: { did: newDeliveryman.did }
        })
        console.log('查詢外送員成功:', deliveryman)

        // 更新外送員
        const updatedDeliveryman = await prisma.deliveryman.update({
            where: { did: newDeliveryman.did },
            data: {
                dphonenumber: '0987654321'
            }
        })
        console.log('更新外送員成功:', updatedDeliveryman)

        console.log('\n===== 2. 測試餐廳（Restaurant）操作 =====')

        // 生成隨機帳號
        const randomAccount = 'testrestaurant_' + Math.random().toString(36).substring(2, 15)

        // 建立餐廳
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

        // 建立餐點
        const newMenuItem = await prisma.menu.create({
            data: {
                rid: newRestaurant.rid,
                dishid: 1,
                name: '測試餐點',
                price: 100.00,
                description: '測試餐點描述',
                image: 'https://example.com/test-image.jpg',
                category: '主餐',
                isavailable: true,
                ispopular: false
            }
        })
        console.log('建立餐點成功:', newMenuItem)

        // 查詢餐廳及其菜單
        const restaurant = await prisma.restaurant.findUnique({
            where: { rid: newRestaurant.rid },
            include: {
                menu: true
            }
        })
        console.log('查詢餐廳及菜單成功:', restaurant)

        console.log('\n===== 3. 測試訂單（Order）操作 =====')

        // 建立訂單
        const newOrder = await prisma.order.create({
            data: {
                oid: Math.floor(Math.random() * 1000000), // 使用隨機訂單ID
                did: newDeliveryman.did,
                rid: newRestaurant.rid,
                ostatus: '處理中',
                totalprice: 100.00
            }
        })
        console.log('建立訂單成功:', newOrder)

        // 更新訂單狀態
        const updatedOrder = await prisma.order.update({
            where: { oid: newOrder.oid },
            data: {
                ostatus: '已完成',
                deliveredtime: new Date()
            }
        })
        console.log('更新訂單成功:', updatedOrder)

        console.log('\n===== 4. 測試付款（Payment）操作 =====')

        // 建立付款記錄
        const newPayment = await prisma.payment.create({
            data: {
                pid: Math.floor(Math.random() * 1000000), // 使用隨機付款ID
                oid: newOrder.oid,
                amount: 100.00,
                category: '信用卡'
            }
        })
        console.log('建立付款記錄成功:', newPayment)

        // 查詢付款記錄
        const payment = await prisma.payment.findUnique({
            where: { pid: newPayment.pid },
            include: {
                order: true
            }
        })
        console.log('查詢付款記錄成功:', payment)

        console.log('\n===== 5. 清理測試資料 =====')

        // 刪除測試資料（注意刪除順序以避免外鍵約束問題）
        await prisma.payment.delete({ where: { pid: newPayment.pid } })
        await prisma.order.delete({ where: { oid: newOrder.oid } })
        await prisma.menu.delete({
            where: {
                rid_dishid: {
                    rid: newRestaurant.rid,
                    dishid: newMenuItem.dishid
                }
            }
        })
        await prisma.restaurant.delete({ where: { rid: newRestaurant.rid } })
        await prisma.deliveryman.delete({ where: { did: newDeliveryman.did } })

        console.log('測試資料清理完成')

    } catch (error) {
        console.error('測試過程中發生錯誤:', error)
    } finally {
        await prisma.$disconnect()
    }
}

// 執行測試
testDatabaseOperations() 