# ติดตั้ง dependencies ที่จำเป็น
npm install @prisma/client @nestjs/config class-validator class-transformer bcrypt
 
# สร้าง Prisma Client
npx prisma generate
 
# อัปเดต Database
npx prisma db push
 
# สร้าง module ใหม่
nest g resource modules/accounts





งาน
📋 Prisma Commands ทั้ง 4 คำสั่ง
1. npx prisma generate - สร้าง Prisma Client
วัตถุประสงค์: สร้าง TypeScript types และ client library จาก schema.prisma

ตรรกะการทำงาน:

อ่านไฟล์ prisma/schema.prisma
สร้าง TypeScript types ให้กับทุก model
สร้าง Prisma Client ที่ใช้ติดต่อฐานข้อมูล
เก็บไว้ใน node_modules/.prisma/client
เมื่อไหร่ต้องใช้:

ครั้งแรกที่ติดตั้งโปรเจค
ทุกครั้งที่แก้ไข schema.prisma
หลังจาก npm install ใหม่
2. npx prisma db push - อัปเดต Database Schema
วัตถุประสงค์: ซิงค์ schema จาก Prisma ไปยัง database โดยตรง

ตรรกะการทำงาน:

เปรียบเทียบ schema ใน Prisma กับ database ปัจจุบัน
สร้าง/แก้ไข tables ใน database ให้ตรงกับ schema
ไม่สร้าง migration files (ข้ามขั้นตอน migration)
เมื่อไหร่ต้องใช้:

Development phase เมื่อต้องการเปลี่ยนแปลง schema รวดเร็ว
โปรเจคส่วนตัวหรือ prototype
เมื่อไม่ต้องการเก็บประวัติการเปลี่ยนแปลง database
3. npx prisma studio - เปิด Database GUI
วัตถุประสงค์: เปิดหน้าต่าง GUI สำหรับดูและแก้ไขข้อมูล

ตรรกะการทำงาน:

เริ่ม web server บนพอร์ต 5555 (default)
แสดงข้อมูลทั้งหมดใน database แบบ table view
สามารถเพิ่ม/แก้ไข/ลบข้อมูลได้โดยตรง
เมื่อไหร่ต้องใช้:

ต้องการดูข้อมูลใน database
ทดสอบข้อมูลหรือ debug
ไม่ต้องการเขียน SQL query
4. npx prisma migrate dev - สร้าง Migration
วัตถุประสงค์: สร้าง migration files และอัปเดต database แบบมีประวัติ

ตรรกะการทำงาน:

สร้าง migration file ใหม่ใน prisma/migrations/
บันทึกการเปลี่ยนแปลง schema เป็น SQL
รัน migration เพื่ออัปเดต database
เก็บประวัติการเปลี่ยนแปลงไว้
เมื่อไหร่ต้องใช้:

Production environment
โปรเจคทีมงาน
ต้องการ version control สำหรับ database schema
ต้องการ rollback ได้
🔄 ลำดับการใช้งานในสถานการณ์ต่างๆ
Development Phase (แนะนำ)
bash
# 1. แก้ไข schema.prisma
# 2. สร้าง Prisma Client
npx prisma generate
 
# 3. อัปเดต database รวดเร็ว
npx prisma db push
 
# 4. เปิด GUI ดูข้อมูล
npx prisma studio






logic 

Client (login) → clientId
    ↓
AccountOwner (find all accounts for client and the client can click in which account and it will go page detail of the account that )
    ↓
├── Accounts (basic account info) 
├── ClientSavingArrangement (deposit balances)
├── ClientLoanArrangement (loan details)
└── Transactions (transaction history)



1. when check the connect to phone "C:\Users\advice\AppData\Local\Android\sdk\platform-tools\adb.exe devices"
2. Step 3 — Set up port forwarding (the key step):
   C:\Users\advice\AppData\Local\Android\sdk\platform-tools\adb.exe reverse tcp:4000 tcp:4000
   This makes your phone's localhost:4000 tunnel through USB to your PC's port 4000.



   new table add "-- Table 1: meeting_notification
CREATE TABLE IF NOT EXISTS meeting_notification (
    id          UUID        NOT NULL DEFAULT gen_random_uuid(),
    vb_code     CHAR(7)     NOT NULL,
    meeting_date DATE       NOT NULL,
    message     VARCHAR(255) NOT NULL,
    is_active   BOOLEAN     NOT NULL DEFAULT true,
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
 
    CONSTRAINT meeting_notification_pkey PRIMARY KEY (id)
);
 
-- Table 2: client_meeting_notification
CREATE TABLE IF NOT EXISTS client_meeting_notification (
    id              UUID        NOT NULL DEFAULT gen_random_uuid(),
    notification_id UUID        NOT NULL,
    username        VARCHAR(50) NOT NULL,
    is_read         BOOLEAN     NOT NULL DEFAULT false,
    read_at         TIMESTAMP   NULL,
    created_at      TIMESTAMP   NOT NULL DEFAULT now(),
 
    CONSTRAINT client_meeting_notification_pkey PRIMARY KEY (id),
    CONSTRAINT unique_client_notification UNIQUE (notification_id, username),
    CONSTRAINT fk_client_meeting_notification_notification
        FOREIGN KEY (notification_id)
        REFERENCES meeting_notification (id)
        ON DELETE CASCADE
);"


-- 1. Drop old unique constraints
ALTER TABLE devices_fcm DROP CONSTRAINT IF EXISTS "devices_fcm_username_key";
ALTER TABLE devices_fcm DROP CONSTRAINT IF EXISTS "devices_fcm_device_id_key";
 
-- 2. Add new composite unique constraint (username + device_id)
ALTER TABLE devices_fcm ADD CONSTRAINT "devices_fcm_username_deviceId_key" UNIQUE (username, device_id);

ALTER TABLE devices_fcm ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;