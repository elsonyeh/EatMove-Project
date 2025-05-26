import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const rid = url.searchParams.get("rid")

    if (!rid) {
      return NextResponse.json({ 
        success: false, 
        message: "缺少餐廳ID" 
      }, { status: 400 })
    }

    // 獲取餐廳基本資訊
    const restaurantResult = await pool.query(`
      SELECT rid, rname, rating, min_order, image, business_hours, is_open, delivery_area, cuisine
      FROM restaurant 
      WHERE rid = $1
    `, [rid])

    if (restaurantResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: "餐廳不存在" 
      }, { status: 404 })
    }

    const restaurant = restaurantResult.rows[0]

    // 獲取今日訂單統計
    const todayOrdersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'preparing' THEN 1 ELSE 0 END) as preparing_orders,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as today_revenue
      FROM orders 
      WHERE rid = $1 AND DATE(order_time) = CURRENT_DATE
    `, [rid])

    // 獲取昨日訂單統計（用於比較）
    const yesterdayOrdersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as yesterday_revenue
      FROM orders 
      WHERE rid = $1 AND DATE(order_time) = CURRENT_DATE - INTERVAL '1 day'
    `, [rid])

    // 獲取上週平均評分（用於比較）
    const lastWeekRatingResult = await pool.query(`
      SELECT AVG(restaurant_rating) as avg_rating
      FROM ratings 
      WHERE rid = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'
    `, [rid])

    // 獲取今日訂單詳細列表
    const ordersResult = await pool.query(`
      SELECT 
        o.*,
        m.name as member_name,
        m.address as member_address,
        m.phonenumber as member_phone
      FROM orders o
      LEFT JOIN member m ON o.mid = m.mid
      WHERE o.rid = $1 AND DATE(o.order_time) = CURRENT_DATE
      ORDER BY o.order_time DESC
    `, [rid])

    // 獲取訂單項目詳細資訊
    const orderIds = ordersResult.rows.map(order => order.oid)
    let orderItemsMap = new Map()
    
    if (orderIds.length > 0) {
      const orderItemsResult = await pool.query(`
        SELECT 
          oi.*,
          m.name as dish_name,
          m.price as dish_price,
          m.image as dish_image,
          m.description as dish_description
        FROM order_items oi
        LEFT JOIN menu m ON oi.rid = m.rid AND oi.dishid = m.dishid
        WHERE oi.oid = ANY($1)
        ORDER BY oi.oid, oi.item_id
      `, [orderIds])

      // 將訂單項目按訂單ID分組
      orderItemsResult.rows.forEach(item => {
        if (!orderItemsMap.has(item.oid)) {
          orderItemsMap.set(item.oid, [])
        }
        orderItemsMap.get(item.oid).push({
          id: item.item_id,
          name: item.dish_name || '未知商品',
          price: parseFloat(item.dish_price) || parseFloat(item.unit_price),
          quantity: item.quantity,
          image: item.dish_image || '/images/menu/default.jpg',
          description: item.dish_description,
          specialInstructions: item.special_instructions,
          subtotal: parseFloat(item.subtotal)
        })
      })
    }

    // 計算統計數據
    const todayStats = todayOrdersResult.rows[0]
    const yesterdayStats = yesterdayOrdersResult.rows[0]
    const lastWeekRating = lastWeekRatingResult.rows[0]

    // 計算變化百分比
    const orderChangePercent = yesterdayStats.total_orders > 0 
      ? ((todayStats.total_orders - yesterdayStats.total_orders) / yesterdayStats.total_orders * 100).toFixed(1)
      : todayStats.total_orders > 0 ? "100" : "0"

    const revenueChangePercent = yesterdayStats.yesterday_revenue > 0 
      ? ((todayStats.today_revenue - yesterdayStats.yesterday_revenue) / yesterdayStats.yesterday_revenue * 100).toFixed(1)
      : todayStats.today_revenue > 0 ? "100" : "0"

    const ratingChange = lastWeekRating.avg_rating 
      ? (restaurant.rating - parseFloat(lastWeekRating.avg_rating)).toFixed(1)
      : "0"

    return NextResponse.json({
      success: true,
      data: {
        restaurant: {
          rid: restaurant.rid,
          name: restaurant.rname,
          rating: parseFloat(restaurant.rating) || 4.5,
          minOrder: restaurant.min_order || 300,
          image: restaurant.image || '/images/restaurants/default.jpg',
          businessHours: restaurant.business_hours || '09:00-22:00',
          isOpen: restaurant.is_open !== false,
          deliveryArea: restaurant.delivery_area || '高雄市',
          cuisine: restaurant.cuisine || '綜合料理'
        },
        stats: {
          todayOrders: parseInt(todayStats.total_orders),
          todayRevenue: parseFloat(todayStats.today_revenue),
          currentRating: parseFloat(restaurant.rating) || 4.5,
          pendingOrders: parseInt(todayStats.pending_orders),
          preparingOrders: parseInt(todayStats.preparing_orders),
          completedOrders: parseInt(todayStats.completed_orders),
          cancelledOrders: parseInt(todayStats.cancelled_orders),
          orderChangePercent: parseFloat(orderChangePercent),
          revenueChangePercent: parseFloat(revenueChangePercent),
          ratingChange: parseFloat(ratingChange)
        },
        orders: ordersResult.rows.map(order => ({
          id: order.oid,
          orderNumber: `#${order.oid.toString().padStart(6, '0')}`,
          customerName: order.member_name || '未知用戶',
          customerPhone: order.member_phone || '',
          customerAddress: order.member_address || order.delivery_address,
          items: orderItemsMap.get(order.oid) || [],
          total: parseFloat(order.total_amount),
          deliveryFee: parseFloat(order.delivery_fee) || 0,
          status: order.status,
          orderTime: order.order_time,
          estimatedDeliveryTime: order.estimated_delivery_time,
          actualDeliveryTime: order.actual_delivery_time,
          notes: order.notes,
          paymentMethod: order.payment_method || 'cash'
        }))
      }
    })

  } catch (err: any) {
    console.error("❌ 獲取餐廳儀表板資料失敗：", err)
    return NextResponse.json({ 
      success: false, 
      message: "獲取餐廳儀表板資料失敗", 
      error: err.message 
    }, { status: 500 })
  }
} 