import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { username, password, role, faceDescriptor, plaintext } = await req.json();

    // 修正參數驗證邏輯：人臉辨識登入時不需要密碼
    if (!username || !role) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    // 如果不是人臉辨識登入，則需要密碼
    if (!faceDescriptor && !password) {
      return NextResponse.json(
        { success: false, message: "請提供密碼或使用人臉辨識" },
        { status: 400 }
      );
    }

    let result;
    
    if (role === "member") {
      // 查詢會員資料（使用 email 作為登入帳號）
      result = await pool.query(
        "SELECT mid, name, email, password, phonenumber, address, wallet, face_descriptor FROM member WHERE email = $1",
        [username]
      );
    } else if (role === "deliveryman") {
      // 查詢外送員資料
      result = await pool.query(
        "SELECT did as mid, dname as name, demail as email, dpassword as password, dphonenumber as phonenumber, face_descriptor FROM deliveryman WHERE demail = $1",
        [username]
      );
    } else if (role === "restaurant") {
      // 查詢餐廳資料
      result = await pool.query(
        "SELECT rid as mid, rname as name, remail as email, rpassword as password, rphonenumber as phonenumber, raddress as address FROM restaurant WHERE remail = $1",
        [username]
      );
    } else {
      return NextResponse.json(
        { success: false, message: "無效的用戶類型" },
        { status: 400 }
      );
    }

    if (!result || result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "帳號不存在" },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // 如果是人臉辨識登入
    if (faceDescriptor) {
      if (!user.face_descriptor) {
        return NextResponse.json(
          { success: false, message: "此帳號尚未註冊人臉特徵，請使用密碼登入" },
          { status: 401 }
        );
      }
      // 人臉辨識已在前端完成驗證，這裡直接通過
      console.log("人臉辨識登入成功:", username);
    } else {
      // 密碼登入驗證
      if (!password) {
        return NextResponse.json(
          { success: false, message: "請提供密碼" },
          { status: 401 }
        );
      }

      // 如果是明文密碼模式，直接比較密碼
      if (plaintext) {
        if (password !== user.password) {
          return NextResponse.json(
            { success: false, message: "帳號或密碼錯誤" },
            { status: 401 }
          );
        }
      } else {
        // 這裡可以加入加密密碼的比對邏輯，但現在我們不需要
        if (password !== user.password) {
          return NextResponse.json(
            { success: false, message: "帳號或密碼錯誤" },
            { status: 401 }
          );
        }
      }
    }

    // 移除敏感資訊後回傳用戶資料
    const { password: _, face_descriptor: __, ...userData } = user;
    return NextResponse.json({
      success: true,
      data: userData
    });
  } catch (error: any) {
    console.error("登入失敗:", error);
    return NextResponse.json(
      { success: false, message: "登入失敗", error: error.message },
      { status: 500 }
    );
  }
} 