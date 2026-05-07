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
