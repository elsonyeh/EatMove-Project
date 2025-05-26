-- 會員資料表
CREATE TABLE IF NOT EXISTS member (
    mid VARCHAR(7) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    phonenumber VARCHAR(20),
    address TEXT,
    createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    wallet DECIMAL(10,2) DEFAULT 0,
    face_descriptor FLOAT[] DEFAULT NULL
);

-- 餐廳資料表
CREATE TABLE IF NOT EXISTS restaurant (
    rid SERIAL PRIMARY KEY,
    account VARCHAR(50) UNIQUE NOT NULL,
    rname VARCHAR(100) NOT NULL,
    raddress TEXT,
    description TEXT,
    rphonenumber VARCHAR(20),
    remail VARCHAR(100) UNIQUE NOT NULL,
    rpassword VARCHAR(100) NOT NULL,
    createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 外送員資料表
CREATE TABLE IF NOT EXISTS deliveryman (
    did SERIAL PRIMARY KEY,
    dname VARCHAR(50) NOT NULL,
    dphonenumber VARCHAR(20) UNIQUE NOT NULL,
    dpassword VARCHAR(100) NOT NULL,
    demail VARCHAR(100) UNIQUE NOT NULL,
    createtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'offline'
); 