import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function POST(req) {
  try {
    const { role, account, name, email, password, phonenumber, address, description } = await req.json();

    console.log("📥 收到前端傳來資料:", { role, account, name, email, password, phonenumber, address, description });

    if (role === "member") {
      await pool.query(
        `INSERT INTO member (mid, name, address, createtime, wallet, phonenumber, email, introducer)
         VALUES ($1, $2, $3, NOW(), 0, $4, $5, NULL)`,
        [name, name, address || "暫時地址", phonenumber, email]
      );
      console.log("✅ 成功寫入 member");
    } else if (role === "restaurant") {
      await pool.query(
        `INSERT INTO restaurant (account, rname, raddress, description, rphonenumber, remail, rpassword)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [account, name, address || "暫時地址", description || "暫時描述", phonenumber, email, password]
      );
      console.log("✅ 成功寫入 restaurant");
    } else if (role === "deliveryman") {
      await pool.query(
        `INSERT INTO deliveryman (dname, dphonenumber)
         VALUES ($1, $2)`,
        [name, phonenumber]
      );
      console.log("✅ 成功寫入 deliveryman");
    } else {
      return NextResponse.json({ success: false, message: "❌ 無效的角色" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "✅ 註冊成功" });
  } catch (err) {
    console.error("❌ 註冊錯誤:", err);
    return NextResponse.json({ success: false, message: "❌ 註冊失敗", error: err.message }, { status: 500 });
  }
}
