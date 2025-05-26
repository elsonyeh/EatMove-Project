const { Client } = require('pg')
require('dotenv').config()

const client = new Client({
    user: 'postgres',
    password: 'YCaWNvWdsQubMRAgKExnVNtPCJMqXZXE',
    host: 'nozomi.proxy.rlwy.net',
    port: 25558,
    database: 'railway',
    ssl: {
        rejectUnauthorized: false
    }
})

const createTable = async () => {
    try {
        await client.connect()

        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "FaceDescriptor" (
        "id" SERIAL PRIMARY KEY,
        "memberId" VARCHAR NOT NULL UNIQUE,
        "descriptor" FLOAT[] NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("memberId") REFERENCES "member"("mid")
      );
    `

        await client.query(createTableQuery)
        console.log('成功建立 FaceDescriptor 表格')

    } catch (error) {
        console.error('建立表格時發生錯誤:', error)
    } finally {
        await client.end()
    }
}

createTable() 