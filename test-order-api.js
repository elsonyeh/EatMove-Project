async function testOrderAPI() {
    try {
        console.log('🔍 測試訂單API...');

        const orderData = {
            uid: "1",
            rid: 6,
            items: [{
                dishId: 1,
                quantity: 1,
                unitPrice: 100,
                subtotal: 100,
                specialInstructions: ""
            }],
            deliveryAddress: "測試地址",
            totalAmount: 160,
            deliveryFee: 60,
            notes: "測試訂單"
        };

        console.log('📦 發送訂單資料:', JSON.stringify(orderData, null, 2));

        const response = await fetch('http://localhost:3001/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData)
        });

        console.log('📊 回應狀態:', response.status);
        console.log('📊 回應標頭:', response.headers.get('content-type'));

        const responseText = await response.text();
        console.log('📊 回應內容:', responseText.substring(0, 500));

        try {
            const result = JSON.parse(responseText);
            console.log('📊 解析後的JSON:', result);

            if (!result.success) {
                console.error('❌ 訂單創建失敗:', result.message);
                console.error('錯誤詳情:', result.error);
            } else {
                console.log('✅ 訂單創建成功，訂單ID:', result.orderId);
            }
        } catch (parseError) {
            console.error('❌ JSON解析失敗:', parseError.message);
        }

    } catch (error) {
        console.error('❌ 測試失敗:', error);
    }
}

testOrderAPI(); 