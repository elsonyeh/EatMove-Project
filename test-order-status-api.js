async function testOrderStatusAPI() {
    try {
        console.log('🔍 測試訂單狀態更新API...');

        const orderId = 7; // 使用錯誤訊息中的訂單ID
        const newStatus = 'preparing';

        console.log(`📦 更新訂單 ${orderId} 狀態為: ${newStatus}`);

        const response = await fetch(`http://localhost:3000/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        });

        console.log('📊 回應狀態:', response.status);
        console.log('📊 回應標頭:', response.headers.get('content-type'));

        const responseText = await response.text();
        console.log('📊 回應內容:', responseText.substring(0, 500));

        try {
            const result = JSON.parse(responseText);
            console.log('📊 解析後的JSON:', result);

            if (!result.success) {
                console.error('❌ 狀態更新失敗:', result.message);
                console.error('錯誤詳情:', result.error);
            } else {
                console.log('✅ 狀態更新成功');
            }
        } catch (parseError) {
            console.error('❌ JSON解析失敗:', parseError.message);
        }

    } catch (error) {
        console.error('❌ 測試失敗:', error);
    }
}

testOrderStatusAPI(); 