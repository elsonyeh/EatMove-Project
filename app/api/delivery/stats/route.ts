import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const did = searchParams.get("did");

    if (!did) {
      return NextResponse.json(
        { success: false, message: "缺少外送員 ID" },
        { status: 400 }
      );
    }

    // 獲取今日統計
    const today = new Date().toISOString().split('T')[0];
    
    // 今日訂單數量和收入
    const todayStats = await pool.query(`
      SELECT 
        COUNT(*) as today_orders,
        COALESCE(SUM(delivery_fee), 0) as today_earnings
      FROM orders 
      WHERE did = $1 
        AND status = 'completed'
        AND DATE(created_at) = $2
    `, [did, today]);

    // 平均評分
    const ratingStats = await pool.query(`
      SELECT 
        COALESCE(AVG(delivery_rating), 0) as average_rating,
        COUNT(*) as total_ratings
      FROM ratings 
      WHERE did = $1
    `, [did]);

    // 總完成訂單數
    const totalCompleted = await pool.query(`
      SELECT COUNT(*) as completed_orders
      FROM orders 
      WHERE did = $1 AND status = 'completed'
    `, [did]);

    const stats = {
      todayOrders: parseInt(todayStats.rows[0].today_orders) || 0,
      todayEarnings: parseFloat(todayStats.rows[0].today_earnings) || 0,
      averageRating: parseFloat(ratingStats.rows[0].average_rating) || 0,
      completedOrders: parseInt(totalCompleted.rows[0].completed_orders) || 0
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error: any) {
    console.error("獲取外送員統計失敗:", error);
    return NextResponse.json(
      { success: false, message: "獲取統計資料失敗", error: error.message },
      { status: 500 }
    );
  }
} 