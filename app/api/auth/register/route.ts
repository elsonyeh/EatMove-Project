import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { name, email, password, phonenumber, role, face_descriptor, plaintext, account, address, description } = await req.json();

    console.log("📝 註冊請求資料:", { name, email, role, phonenumber });

    if (!name || !email || !password || !phonenumber || !role) {
      return NextResponse.json(
        { success: false, message: "缺少必要欄位" },
        { status: 400 }
      );
    }

    // 檢查同一角色內的 email 是否已存在
    let checkEmailQuery;
    let roleDisplayName;
    
    if (role === "member") {
      checkEmailQuery = "SELECT email FROM member WHERE email = $1";
      roleDisplayName = "用戶";
    } else if (role === "deliveryman") {
      checkEmailQuery = "SELECT demail FROM deliveryman WHERE demail = $1";
      roleDisplayName = "外送員";
    } else if (role === "restaurant") {
      checkEmailQuery = "SELECT remail FROM restaurant WHERE remail = $1";
      roleDisplayName = "店家";
    } else {
      return NextResponse.json(
        { success: false, message: "無效的角色類型" },
        { status: 400 }
      );
    }

    const existingUser = await pool.query(checkEmailQuery, [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `此電子郵件已被其他${roleDisplayName}使用`,
          errorType: "EMAIL_EXISTS",
          role: role,
          suggestion: `請使用其他電子郵件地址註冊${roleDisplayName}帳號，或檢查是否已有${roleDisplayName}帳號可以登入`
        },
        { status: 400 }
      );
    }

    // 檢查電話號碼是否在同一角色內重複
    let checkPhoneQuery;
    if (role === "member") {
      checkPhoneQuery = "SELECT phonenumber FROM member WHERE phonenumber = $1";
    } else if (role === "deliveryman") {
      checkPhoneQuery = "SELECT dphonenumber FROM deliveryman WHERE dphonenumber = $1";
    } else if (role === "restaurant") {
      checkPhoneQuery = "SELECT rphonenumber FROM restaurant WHERE rphonenumber = $1";
    }

    if (checkPhoneQuery && phonenumber) {
      const existingPhone = await pool.query(checkPhoneQuery, [phonenumber]);
      if (existingPhone.rows.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: `此電話號碼已被其他${roleDisplayName}使用`,
            errorType: "PHONE_EXISTS",
            role: role,
            suggestion: `請使用其他電話號碼註冊${roleDisplayName}帳號`
          },
          { status: 400 }
        );
      }
    }

    let result;
    if (role === "member") {
      // 生成會員 ID (MID) - 只考慮有效的M開頭格式
      const midResult = await pool.query(
        "SELECT mid FROM member WHERE mid LIKE 'M%' AND LENGTH(mid) = 7 ORDER BY mid DESC LIMIT 1"
      );
      
      let newMidNumber = 1; // 預設從1開始
      
      if (midResult.rows.length > 0) {
        const lastMid = midResult.rows[0].mid;
        const lastNumber = parseInt(lastMid.substring(1));
        if (!isNaN(lastNumber)) {
          newMidNumber = lastNumber + 1;
        }
      }
      
      const newMid = `M${newMidNumber.toString().padStart(6, "0")}`;
      console.log("🆔 生成新會員ID:", newMid);

      // 使用明文密碼註冊會員
      result = await pool.query(
        `INSERT INTO member (mid, name, email, password, phonenumber, address, face_descriptor)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING mid, name, email, phonenumber, address`,
        [newMid, name, email, password, phonenumber, address || "暫時地址", face_descriptor]
      );
    } else if (role === "deliveryman") {
      console.log("🚚 註冊外送員:", { name, email, phonenumber });
      
      // 首先確保deliveryman表有face_descriptor欄位
      try {
        await pool.query(`
          DO $$ 
          BEGIN 
            BEGIN
              ALTER TABLE deliveryman ADD COLUMN face_descriptor float8[];
            EXCEPTION 
              WHEN duplicate_column THEN 
                NULL;
            END;
            
            BEGIN
              ALTER TABLE deliveryman ADD COLUMN status VARCHAR(20) DEFAULT 'offline';
            EXCEPTION 
              WHEN duplicate_column THEN 
                NULL;
            END;
          END $$;
        `);
      } catch (alterError: any) {
        console.log("表結構已存在或修改失敗:", alterError.message);
      }

      // 使用明文密碼註冊外送員
      result = await pool.query(
        `INSERT INTO deliveryman (dname, demail, dpassword, dphonenumber, face_descriptor, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING did, dname as name, demail as email, dphonenumber as phonenumber, status`,
        [name, email, password, phonenumber, face_descriptor, 'offline']
      );
      
      console.log("✅ 外送員註冊成功:", result.rows[0]);
    } else if (role === "restaurant") {
      // 註冊餐廳
      // 如果沒有提供 account，使用 email 作為帳號
      const restaurantAccount = account || email;
      
      // 檢查餐廳帳號是否重複
      const existingAccount = await pool.query(
        "SELECT account FROM restaurant WHERE account = $1",
        [restaurantAccount]
      );
      
      if (existingAccount.rows.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            message: "此帳號名稱已被其他店家使用",
            errorType: "ACCOUNT_EXISTS",
            role: role,
            suggestion: "請使用其他帳號名稱註冊店家帳號"
          },
          { status: 400 }
        );
      }
      
      result = await pool.query(
        `INSERT INTO restaurant (account, rname, raddress, description, rphonenumber, remail, rpassword)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING rid, account, rname as name, remail as email, rphonenumber as phonenumber, raddress as address, description`,
        [restaurantAccount, name, address || "暫時地址", description || "暫無描述", phonenumber, email, password]
      );
    }

    console.log("✅ 註冊成功:", result?.rows[0]);

    return NextResponse.json({
      success: true,
      message: `${roleDisplayName}註冊成功！歡迎加入EatMove平台`,
      data: result?.rows[0] || null,
      role: role
    });
  } catch (error: any) {
    console.error("❌ 註冊失敗:", error);
    
    // 處理資料庫約束錯誤
    if (error.code === '23505') { // PostgreSQL unique constraint violation
      let message = "註冊失敗：資料重複";
      let suggestion = "請檢查輸入的資料是否已被使用";
      
      if (error.constraint && error.constraint.includes('email')) {
        message = "此電子郵件已被使用";
        suggestion = "請使用其他電子郵件地址或檢查是否已有帳號可以登入";
      } else if (error.constraint && error.constraint.includes('phone')) {
        message = "此電話號碼已被使用";
        suggestion = "請使用其他電話號碼";
      } else if (error.constraint && error.constraint.includes('account')) {
        message = "此帳號名稱已被使用";
        suggestion = "請使用其他帳號名稱";
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: message,
          errorType: "CONSTRAINT_VIOLATION",
          suggestion: suggestion
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: "註冊失敗", error: error.message },
      { status: 500 }
    );
  }
} 