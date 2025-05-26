const { pool } = require('./lib/db.ts')

async function testFaceAuth() {
    try {
        console.log('=== 檢查資料庫結構 ===')

        // 檢查 member 表的 face_descriptor 欄位
        const memberColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'member' AND column_name = 'face_descriptor'
    `)
        console.log('Member face_descriptor 欄位:', memberColumns.rows)

        // 檢查 deliveryman 表的 face_descriptor 欄位
        const deliveryColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'deliveryman' AND column_name = 'face_descriptor'
    `)
        console.log('Deliveryman face_descriptor 欄位:', deliveryColumns.rows)

        console.log('\n=== 檢查現有用戶的人臉資料 ===')

        // 檢查有人臉資料的 member
        const membersWithFace = await pool.query(`
      SELECT mid, name, email, 
             CASE 
               WHEN face_descriptor IS NOT NULL THEN '有人臉資料'
               ELSE '無人臉資料'
             END as face_status,
             CASE 
               WHEN face_descriptor IS NOT NULL THEN array_length(face_descriptor, 1)
               ELSE 0
             END as descriptor_length
      FROM member 
      LIMIT 5
    `)
        console.log('Member 用戶人臉資料狀態:')
        membersWithFace.rows.forEach(row => {
            console.log(`  ${row.name} (${row.email}): ${row.face_status}, 長度: ${row.descriptor_length}`)
        })

        // 檢查有人臉資料的 deliveryman
        const deliveryWithFace = await pool.query(`
      SELECT did, name, email,
             CASE 
               WHEN face_descriptor IS NOT NULL THEN '有人臉資料'
               ELSE '無人臉資料'
             END as face_status,
             CASE 
               WHEN face_descriptor IS NOT NULL THEN array_length(face_descriptor, 1)
               ELSE 0
             END as descriptor_length
      FROM deliveryman 
      LIMIT 5
    `)
        console.log('\nDeliveryman 用戶人臉資料狀態:')
        deliveryWithFace.rows.forEach(row => {
            console.log(`  ${row.name} (${row.email}): ${row.face_status}, 長度: ${row.descriptor_length}`)
        })

        console.log('\n=== 測試 face-auth API 邏輯 ===')

        // 找一個有人臉資料的用戶來測試
        const testMember = await pool.query(`
      SELECT mid, name, email, face_descriptor 
      FROM member 
      WHERE face_descriptor IS NOT NULL 
      LIMIT 1
    `)

        if (testMember.rows.length > 0) {
            const user = testMember.rows[0]
            console.log(`測試用戶: ${user.name} (${user.email})`)
            console.log(`人臉特徵長度: ${user.face_descriptor ? user.face_descriptor.length : 0}`)

            // 模擬 face-auth API GET 請求
            const faceData = await pool.query(`
        SELECT face_descriptor FROM member WHERE mid = $1
      `, [user.mid])

            if (faceData.rows.length > 0 && faceData.rows[0].face_descriptor) {
                console.log('✓ 成功從資料庫讀取人臉特徵')
                console.log(`  特徵向量長度: ${faceData.rows[0].face_descriptor.length}`)
                console.log(`  前5個值: [${faceData.rows[0].face_descriptor.slice(0, 5).join(', ')}...]`)
            } else {
                console.log('✗ 無法從資料庫讀取人臉特徵')
            }
        } else {
            console.log('沒有找到有人臉資料的用戶進行測試')
        }

        console.log('\n=== 檢查登入頁面的問題 ===')
        console.log('根據您提供的錯誤訊息：')
        console.log('- 檢測到 1 個人臉 ✓')
        console.log('- 檢測結果存在 ✓')
        console.log('- landmarks 存在 ✓')
        console.log('- descriptor 存在，長度: 128 ✓')
        console.log('- 人臉box: undefined ✗ <- 這是問題所在')
        console.log('')
        console.log('問題分析：')
        console.log('detection.box 為 undefined 表示人臉檢測結果中缺少邊界框資訊')
        console.log('這可能是因為：')
        console.log('1. face-api.js 版本問題')
        console.log('2. 檢測選項設定問題')
        console.log('3. 檢測結果結構變化')

    } catch (error) {
        console.error('測試過程發生錯誤:', error)
    } finally {
        await pool.end()
    }
}

testFaceAuth() 