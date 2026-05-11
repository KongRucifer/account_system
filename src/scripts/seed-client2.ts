/**
 * Seed Script — New Client (bankbookNumber=01256)
 * Creates:
 *  - 1 NEW Client: ສົມໃຈ ວັດທະນາ / Somjai Vatthana
 *  - ClientAccount (login: bankbookNumber=01256 / password=client1234)
 *  - 2 Accounts: ເງິນຝາກ (savings) + ເງິນກູ້ (loan)
 *  - AccountOwner links for both accounts
 *  - ClientLoanArrangement (for loan account)
 *  - 20 Transactions across 2024-2025
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/seed-client2.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { randomUUID } from 'crypto';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as any);

// ─── Constants (verified from real DB) ──────────────────────────────────────
const CLIENT_BANKBOOK    = '01256';
const CLIENT_PASSWORD    = 'client1234';
const VB_CODE            = '0707044';   // ນາ, Province=07, District=0707, Village=044
const PROVINCE_ID        = '07';
const DISTRICT_ID        = '0707';
const STATUS_ACTIVE      = '2';
const ACC_TYPE_SAVINGS   = '1';         // saving accounts
const ACC_TYPE_LOAN      = '5';         // short term loans
const TX_CODE_DEPOSIT    = '2201';      // saving deposit
const TX_CODE_LOAN_PAY   = '1010';      // loan repayment
const TX_CODE_LOAN_DIS   = '1201';      // loan disbursement
const REPAYMENT_TYPE_ID  = '02';        // installment_quarterly
const LOAN_RULE_ID       = '10040081';  // verified from DB

// Account numbers: vbCode(7) + running(8) = 15 chars
const ACC_SAVINGS2       = `${VB_CODE}20001001`;  // ເງິນຝາກ client2
const ACC_LOAN2          = `${VB_CODE}20001002`;  // ເງິນກູ້ client2
const ACC_CASH2          = `${VB_CODE}20009999`;  // counterpart (cash)

async function main() {
  console.log(`🌱  Seeding new client bankbookNumber=${CLIENT_BANKBOOK}...`);

  // ── 1. Create new Client ───────────────────────────────────────────────────
  const existingClient = await prisma.client.findFirst({
    where: { bankbookNumber: CLIENT_BANKBOOK },
    select: { id: true },
  });

  let clientId: string;

  if (existingClient) {
    clientId = existingClient.id;
    console.log(`✅  Client already exists (id: ${clientId}), skipping create`);
  } else {
    const newClient = await prisma.client.create({
      data: {
        id:              randomUUID(),
        bankbookNumber:  CLIENT_BANKBOOK,
        firstName:       'ສົມໃຈ',
        lastName:        'ວັດທະນາ',
        nickName:        'ສົມໃຈ',
        genderEng:       'Female',
        genderLao:       'ຍິງ',
        birthDate:       new Date('1990-05-15'),
        clientType:      'I',        // Individual
        statusId:        STATUS_ACTIVE,
        phoneNumber:     '02055551256',
        vbCode:          VB_CODE,
        sortNo:          '1256',
        isGuarantor:     '0',
        guarantorVolume: 0,
      },
    });
    clientId = newClient.id;
    console.log(`✅  New Client created (id: ${clientId}, bankbookNumber: ${CLIENT_BANKBOOK})`);
  }

  // ── 2. ClientAccount (login credentials) ─────────────────────────────────
  const hashedPwd = await bcrypt.hash(CLIENT_PASSWORD, 10);
  const existingCA = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM client_account WHERE client_id = ${clientId}::uuid LIMIT 1
  `.catch(() => [] as { id: string }[]);

  if (existingCA.length === 0) {
    await prisma.$executeRaw`
      INSERT INTO client_account (id, client_id, vbcode, password)
      VALUES (gen_random_uuid(), ${clientId}::uuid, ${VB_CODE}, ${hashedPwd})
    `;
    console.log(`✅  ClientAccount created (bankbookNumber=${CLIENT_BANKBOOK}, password=${CLIENT_PASSWORD})`);
  } else {
    await prisma.$executeRaw`
      UPDATE client_account SET password = ${hashedPwd} WHERE client_id = ${clientId}::uuid
    `;
    console.log(`✅  ClientAccount updated (password=${CLIENT_PASSWORD})`);
  }

  // ── 3. Counterpart (cash) account ─────────────────────────────────────────
  await prisma.accounts.upsert({
    where: { accNumber: ACC_CASH2 },
    update: {},
    create: {
      accNumber:      ACC_CASH2,
      accLevel:       '1',
      accGroup:       'C',
      accNameEng:     'Cash / Counterpart',
      accNameLao:     'ເງິນສົດ / ຄູ່ຕ້ານ',
      currentBalance: BigInt(0),
      statusId:       STATUS_ACTIVE,
      vbCode:         VB_CODE,
      openingDate:    new Date('2020-01-01'),
    },
  });

  // ── 4. Savings account ────────────────────────────────────────────────────
  await prisma.accounts.upsert({
    where: { accNumber: ACC_SAVINGS2 },
    update: {},
    create: {
      accNumber:      ACC_SAVINGS2,
      accLevel:       '1',
      accGroup:       'S',
      accNameEng:     'Savings Account - Somjai',
      accNameLao:     'ບັນຊີເງິນຝາກ - ສົມໃຈ',
      bankbookNumber: CLIENT_BANKBOOK,
      accTypeId:      ACC_TYPE_SAVINGS,
      currentBalance: BigInt(18_500_000),
      statusId:       STATUS_ACTIVE,
      vbCode:         VB_CODE,
      openingDate:    new Date('2022-06-01'),
    },
  });
  console.log(`✅  Savings account: ${ACC_SAVINGS2}`);

  // ── 5. Loan account ───────────────────────────────────────────────────────
  await prisma.accounts.upsert({
    where: { accNumber: ACC_LOAN2 },
    update: {},
    create: {
      accNumber:      ACC_LOAN2,
      accLevel:       '1',
      accGroup:       'L',
      accNameEng:     'Loan Account - Somjai',
      accNameLao:     'ບັນຊີເງິນກູ້ - ສົມໃຈ',
      bankbookNumber: CLIENT_BANKBOOK,
      accTypeId:      ACC_TYPE_LOAN,
      currentBalance: BigInt(25_000_000),
      statusId:       STATUS_ACTIVE,
      vbCode:         VB_CODE,
      openingDate:    new Date('2023-06-01'),
    },
  });
  console.log(`✅  Loan account: ${ACC_LOAN2}`);

  // ── 6. AccountOwner links ─────────────────────────────────────────────────
  for (const accNumber of [ACC_SAVINGS2, ACC_LOAN2]) {
    await prisma.accountOwner.upsert({
      where: {
        bankbookNumber_accNumber_clientId: {
          bankbookNumber: CLIENT_BANKBOOK,
          accNumber,
          clientId,
        },
      },
      update: {},
      create: {
        bankbookNumber: CLIENT_BANKBOOK,
        accNumber,
        clientId,
        vbCode: VB_CODE,
      },
    });
  }
  console.log(`✅  AccountOwner links (savings + loan)`);

  // ── 7. ClientLoanArrangement (raw SQL — schema drift) ─────────────────────
  const existingLoan = await prisma.clientLoanArrangement.findFirst({
    where: { accNumber: ACC_LOAN2 },
  });
  if (!existingLoan) {
    await prisma.$executeRaw`
      INSERT INTO client_loan_arrangement (
        date, acc_number, is_syndicated, client_loan_rule_id,
        client_loan_repayment_type_id, start_date, loan_period_months, end_date,
        total_loan_amount, loan_outstanding, interest_due, interest_paid,
        interest_unpaid, principal_due, principal_paid, principal_unpaid,
        principal_days_overdue, interest_days_overdue, loan_writtenoff,
        vbcode, status_id, client_loan_int_rate,
        monthly_interest_due, monthly_principal_due
      ) VALUES (
        '2023-06-01', ${ACC_LOAN2}, 'N', ${LOAN_RULE_ID},
        ${REPAYMENT_TYPE_ID}, '2023-06-01', 24, '2025-06-01',
        40000000, 25000000, 800000, 4800000,
        0, 1500000, 15000000, 0,
        0, 0, 'N',
        ${VB_CODE}, ${STATUS_ACTIVE}, 1.5,
        375000, 1666667
      )
    `;
    console.log(`✅  ClientLoanArrangement`);
  } else {
    console.log(`✅  ClientLoanArrangement (already exists)`);
  }

  // ── 8. Transactions (20 items across 2024-2025) ───────────────────────────
  // Delete old seed transactions first (idempotent)
  await prisma.transactions.deleteMany({
    where: {
      debitAccNumber: { in: [ACC_SAVINGS2, ACC_LOAN2] },
      userId: 'seed-client2',
    },
  });

  const txData: { date: Date; acc: string; code: string; amount: bigint; desc: string }[] = [
    // ── ເງິນຝາກ (Savings) — 12 transactions ──────────────────────────────────
    { date: new Date('2024-01-10'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'ຝາກເງິນລາຍເດືອນ ມັງກອນ 2024' },
    { date: new Date('2024-02-10'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'ຝາກເງິນລາຍເດືອນ ກຸມພາ 2024' },
    { date: new Date('2024-03-10'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'ຝາກເງິນລາຍເດືອນ ມີນາ 2024' },
    { date: new Date('2024-04-10'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(2_500_000), desc: 'ຝາກເງິນລາຍເດືອນ ເມສາ 2024' },
    { date: new Date('2024-05-15'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'ຝາກເງິນລາຍເດືອນ ພຶດສະພາ 2024' },
    { date: new Date('2024-06-10'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(3_000_000), desc: 'ຝາກເງິນໂບນັດ ມິຖຸນາ 2024' },
    { date: new Date('2024-07-20'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(1_500_000), desc: 'ຖອນເງິນ ກໍລະກົດ 2024' },
    { date: new Date('2024-09-10'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'ຝາກເງິນລາຍເດືອນ ກັນຍາ 2024' },
    { date: new Date('2024-11-10'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'ຝາກເງິນລາຍເດືອນ ພະຈິກ 2024' },
    { date: new Date('2024-12-10'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(3_500_000), desc: 'ຝາກເງິນໂບນັດທ້າຍປີ 2024' },
    { date: new Date('2025-02-10'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'ຝາກເງິນລາຍເດືອນ ກຸມພາ 2025' },
    { date: new Date('2025-04-10'), acc: ACC_SAVINGS2, code: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'ຝາກເງິນລາຍເດືອນ ເມສາ 2025' },

    // ── ເງິນກູ້ (Loan) — 8 transactions ──────────────────────────────────────
    { date: new Date('2023-06-01'), acc: ACC_LOAN2,    code: TX_CODE_LOAN_DIS, amount: BigInt(40_000_000), desc: 'ປ່ອຍກູ້ໃຫ້ລູກຄ້າ ສົມໃຈ' },
    { date: new Date('2024-03-01'), acc: ACC_LOAN2,    code: TX_CODE_LOAN_PAY, amount: BigInt(2_041_667),  desc: 'ຊຳລະໜີ້ ງວດທີ 1 (ມີນາ 2024)' },
    { date: new Date('2024-06-01'), acc: ACC_LOAN2,    code: TX_CODE_LOAN_PAY, amount: BigInt(2_041_667),  desc: 'ຊຳລະໜີ້ ງວດທີ 2 (ມິຖຸນາ 2024)' },
    { date: new Date('2024-09-01'), acc: ACC_LOAN2,    code: TX_CODE_LOAN_PAY, amount: BigInt(2_041_667),  desc: 'ຊຳລະໜີ້ ງວດທີ 3 (ກັນຍາ 2024)' },
    { date: new Date('2024-12-01'), acc: ACC_LOAN2,    code: TX_CODE_LOAN_PAY, amount: BigInt(2_041_667),  desc: 'ຊຳລະໜີ້ ງວດທີ 4 (ທັນວາ 2024)' },
    { date: new Date('2025-03-01'), acc: ACC_LOAN2,    code: TX_CODE_LOAN_PAY, amount: BigInt(2_041_667),  desc: 'ຊຳລະໜີ້ ງວດທີ 5 (ມີນາ 2025)' },
    { date: new Date('2025-04-15'), acc: ACC_LOAN2,    code: TX_CODE_LOAN_PAY, amount: BigInt(2_041_667),  desc: 'ຊຳລະໜີ້ ງວດທີ 6 (ເມສາ 2025)' },
    { date: new Date('2025-05-01'), acc: ACC_LOAN2,    code: TX_CODE_LOAN_PAY, amount: BigInt(2_041_667),  desc: 'ຊຳລະໜີ້ ງວດທີ 7 (ພຶດສະພາ 2025)' },
  ];

  let count = 0;
  for (const tx of txData) {
    await prisma.transactions.create({
      data: {
        id:                randomUUID(),
        date:              tx.date,
        transactionCodeId: tx.code,
        amount:            tx.amount,
        debitAccNumber:    tx.acc,
        creditAccNumber:   tx.acc === ACC_SAVINGS2 ? ACC_LOAN2 : ACC_SAVINGS2,
        vbCode:            VB_CODE,
        description:       tx.desc,
        userId:            'seed-client2',
      },
    });
    count++;
  }
  console.log(`✅  Transactions (${count} items)`);

  console.log('\n🎉  Seed complete!');
  console.log('─────────────────────────────────────────────');
  console.log('  Client Login:');
  console.log(`    bankbookNumber : ${CLIENT_BANKBOOK}`);
  console.log(`    password       : ${CLIENT_PASSWORD}`);
  console.log('  Accounts:');
  console.log(`    ເງິນຝາກ (Savings) : ${ACC_SAVINGS2}`);
  console.log(`    ເງິນກູ້  (Loan)    : ${ACC_LOAN2}`);
  console.log('─────────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
