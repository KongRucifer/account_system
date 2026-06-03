/**
 * Seed Script — Client 3 (bankbookNumber=02500)
 * Creates:
 *  - 1 NEW Client: ບຸນມີ ສີທັດ / Bounmy Sithad
 *  - ClientAccount (login: bankbookNumber=02500 / password=client1234)
 *  - 2 Accounts: ເງິນຝາກ (savings) + ເງິນກູ້ (loan)
 *  - AccountOwner links for both accounts
 *  - ClientLoanArrangement (for loan account)
 *  - 30 Transactions across 2023-2025 with proper codes:
 *      2201 = ເງິນຝາກ (deposit)
 *      2202 = ເງິນຖອນ (withdrawal)
 *      2203 = ເງິນປັນຜົນ (interest adjustment / profit)
 *      1011 = ຊຳລະຕົ້ນທຶນ (principal repayment)
 *      1012 = ຊຳລະດອກເບ້ຍ (interest repayment)
 *      1201 = ປ່ອຍກູ້ (loan disbursement)
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

// ─── Constants ──────────────────────────────────────────────────────────────
const CLIENT_BANKBOOK    = '02510';
const CLIENT_PASSWORD    = 'client1234';
const VB_CODE            = '0707044';   // ນາ, Province=07, District=0707, Village=044
const STATUS_ACTIVE      = '2';
const ACC_TYPE_SAVINGS   = '1';         // saving accounts
const ACC_TYPE_LOAN      = '5';         // short term loans

// Transaction codes
const TX_DEPOSIT    = '2201';   // ເງິນຝາກ
const TX_WITHDRAW   = '2202';   // ເງິນຖອນ
const TX_INTEREST   = '2203';   // ເງິນປັນຜົນ (interest/profit adjustment)
const TX_PRINCIPAL  = '1011';   // ຊຳລະຕົ້ນທຶນ
const TX_INT_PAY    = '1012';   // ຊຳລະດອກເບ້ຍ
const TX_LOAN_DIS   = '1201';   // ປ່ອຍກູ້

const REPAYMENT_TYPE_ID  = '02';        // installment_quarterly
const LOAN_RULE_ID       = '10040081';  // verified from DB

// Account numbers: vbCode(7) + running(8) = 15 chars
const ACC_SAVINGS2       = `${VB_CODE}30002001`;  // ເງິນຝາກ client3
const ACC_LOAN2          = `${VB_CODE}30002002`;  // ເງິນກູ້ client3
const ACC_CASH2          = `${VB_CODE}30009998`;  // counterpart (cash)

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
        firstName:       'ບຸນມີ',
        lastName:        'ສີທັດ',
        nickName:        'ບຸນມີ',
        genderEng:       'Male',
        genderLao:       'ຊາຍ',
        birthDate:       new Date('1985-08-20'),
        clientType:      'I',
        statusId:        STATUS_ACTIVE,
        phoneNumber:     '02055502500',
        vbCode:          VB_CODE,
        sortNo:          '2500',
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

  // ── 2b. Upsert new TransactionCodes ─────────────────────────────────────────
  const newCodes = [
    {
      transactionCode: TX_WITHDRAW,
      nameEng: 'Client withdraws saving',
      nameLao: 'ລູກຄ້າຖອນເງິນຝາກ',
      debitAccNameEng: 'Cash',
      debitAccNameLao: 'ເງິນສົດ',
      creditAccNameEng: 'Savings Account',
      creditAccNameLao: 'ບັນຊີເງິນຝາກ',
      accGroup: 'S',
    },
    {
      transactionCode: TX_INTEREST,
      nameEng: 'Saving interest / profit adjustment',
      nameLao: 'ດອກເບ້ຍ / ປັນຜົນກຳໄລເງິນຝາກ',
      debitAccNameEng: 'Interest Expense',
      debitAccNameLao: 'ຄ່າໃຊ້ຈ່າຍດອກເບ້ຍ',
      creditAccNameEng: 'Savings Account',
      creditAccNameLao: 'ບັນຊີເງິນຝາກ',
      accGroup: 'S',
    },
    {
      transactionCode: TX_PRINCIPAL,
      nameEng: 'Client repays principal',
      nameLao: 'ລູກຄ້າຊຳລະຕົ້ນທຶນ',
      debitAccNameEng: 'Cash',
      debitAccNameLao: 'ເງິນສົດ',
      creditAccNameEng: 'Loan Account',
      creditAccNameLao: 'ບັນຊີເງິນກູ້',
      accGroup: 'L',
    },
    {
      transactionCode: TX_INT_PAY,
      nameEng: 'Client repays interest',
      nameLao: 'ລູກຄ້າຊຳລະດອກເບ້ຍ',
      debitAccNameEng: 'Cash',
      debitAccNameLao: 'ເງິນສົດ',
      creditAccNameEng: 'Interest Income',
      creditAccNameLao: 'ລາຍຮັບດອກເບ້ຍ',
      accGroup: 'L',
    },
  ];

  for (const code of newCodes) {
    const exists = await prisma.transactionCode.findUnique({
      where: { transactionCode: code.transactionCode },
    });
    if (!exists) {
      await prisma.transactionCode.create({ data: code });
      console.log(`✅  TransactionCode '${code.transactionCode}' created (${code.nameLao})`);
    } else {
      console.log(`✅  TransactionCode '${code.transactionCode}' already exists`);
    }
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
      lastUpdate:     new Date(),
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
      accNameEng:     'Savings Account - Bounmy',
      accNameLao:     'ບັນຊີເງິນຝາກ - ບຸນມີ',
      bankbookNumber: CLIENT_BANKBOOK,
      accTypeId:      ACC_TYPE_SAVINGS,
      currentBalance: BigInt(14_700_000),
      statusId:       STATUS_ACTIVE,
      vbCode:         VB_CODE,
      openingDate:    new Date('2023-01-01'),
      lastUpdate:     new Date(),
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
      accNameEng:     'Loan Account - Bounmy',
      accNameLao:     'ບັນຊີເງິນກູ້ - ບຸນມີ',
      bankbookNumber: CLIENT_BANKBOOK,
      accTypeId:      ACC_TYPE_LOAN,
      currentBalance: BigInt(20_000_000),
      statusId:       STATUS_ACTIVE,
      vbCode:         VB_CODE,
      openingDate:    new Date('2023-03-01'),
      lastUpdate:     new Date(),
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
        '2023-03-01', ${ACC_LOAN2}, 'N', ${LOAN_RULE_ID},
        ${REPAYMENT_TYPE_ID}, '2023-03-01', 36, '2026-03-01',
        45000000, 20000000, 675000, 8100000,
        0, 1250000, 25000000, 0,
        0, 0, 'N',
        ${VB_CODE}, ${STATUS_ACTIVE}, 1.5,
        337500, 1250000
      )
    `;
    console.log(`✅  ClientLoanArrangement`);
  } else {
    console.log(`✅  ClientLoanArrangement (already exists)`);
  }

  // ── 8. Transactions (30 items across 2023-2025) ───────────────────────────
  await prisma.transactions.deleteMany({
    where: {
      debitAccNumber: { in: [ACC_SAVINGS2, ACC_LOAN2] },
      userId: 'seed-client2',
    },
  });

  const txData: { date: Date; acc: string; code: string; amount: bigint; desc: string }[] = [
    // ════════════════════════════════════════════════
    // ບັນຊີເງິນຝາກ — 18 transactions
    // ════════════════════════════════════════════════

    // ── ເງິນຝາກ (2201) ──────────────────────────────
    { date: new Date('2023-02-01'), acc: ACC_SAVINGS2, code: TX_DEPOSIT,   amount: BigInt(3_000_000), desc: 'ຝາກເງິນເປີດບັນຊີ' },
    { date: new Date('2023-05-10'), acc: ACC_SAVINGS2, code: TX_DEPOSIT,   amount: BigInt(2_000_000), desc: 'ຝາກເງິນ ພຶດສະພາ 2023' },
    { date: new Date('2023-09-15'), acc: ACC_SAVINGS2, code: TX_DEPOSIT,   amount: BigInt(2_500_000), desc: 'ຝາກເງິນ ກັນຍາ 2023' },
    { date: new Date('2023-12-10'), acc: ACC_SAVINGS2, code: TX_DEPOSIT,   amount: BigInt(3_000_000), desc: 'ຝາກເງິນໂບນັດ ທັນວາ 2023' },
    { date: new Date('2024-02-10'), acc: ACC_SAVINGS2, code: TX_DEPOSIT,   amount: BigInt(2_000_000), desc: 'ຝາກເງິນ ກຸມພາ 2024' },
    { date: new Date('2024-05-10'), acc: ACC_SAVINGS2, code: TX_DEPOSIT,   amount: BigInt(2_000_000), desc: 'ຝາກເງິນ ພຶດສະພາ 2024' },
    { date: new Date('2024-08-10'), acc: ACC_SAVINGS2, code: TX_DEPOSIT,   amount: BigInt(2_500_000), desc: 'ຝາກເງິນ ສິງຫາ 2024' },
    { date: new Date('2024-11-10'), acc: ACC_SAVINGS2, code: TX_DEPOSIT,   amount: BigInt(2_000_000), desc: 'ຝາກເງິນ ພະຈິກ 2024' },
    { date: new Date('2025-02-10'), acc: ACC_SAVINGS2, code: TX_DEPOSIT,   amount: BigInt(2_000_000), desc: 'ຝາກເງິນ ກຸມພາ 2025' },
    { date: new Date('2025-05-05'), acc: ACC_SAVINGS2, code: TX_DEPOSIT,   amount: BigInt(2_000_000), desc: 'ຝາກເງິນ ພຶດສະພາ 2025' },

    // ── ເງິນຖອນ (2202) ──────────────────────────────
    { date: new Date('2023-07-20'), acc: ACC_SAVINGS2, code: TX_WITHDRAW,  amount: BigInt(500_000),   desc: 'ຖອນເງິນຄ່າໃຊ້ຈ່າຍ ກໍລະກົດ 2023' },
    { date: new Date('2024-01-15'), acc: ACC_SAVINGS2, code: TX_WITHDRAW,  amount: BigInt(1_000_000), desc: 'ຖອນເງິນບຸນປີໃໝ່ 2024' },
    { date: new Date('2024-04-18'), acc: ACC_SAVINGS2, code: TX_WITHDRAW,  amount: BigInt(800_000),   desc: 'ຖອນເງິນຄ່າໃຊ້ຈ່າຍ ເມສາ 2024' },
    { date: new Date('2024-10-05'), acc: ACC_SAVINGS2, code: TX_WITHDRAW,  amount: BigInt(1_500_000), desc: 'ຖອນເງິນສຸກເສີນ ຕຸລາ 2024' },
    { date: new Date('2025-01-10'), acc: ACC_SAVINGS2, code: TX_WITHDRAW,  amount: BigInt(1_000_000), desc: 'ຖອນເງິນ ມັງກອນ 2025' },

    // ── ເງິນປັນຜົນ / ດອກເບ້ຍ (2203) ────────────────
    { date: new Date('2023-12-31'), acc: ACC_SAVINGS2, code: TX_INTEREST,  amount: BigInt(312_500),   desc: 'ດອກເບ້ຍເງິນຝາກ ປີ 2023' },
    { date: new Date('2024-06-30'), acc: ACC_SAVINGS2, code: TX_INTEREST,  amount: BigInt(281_250),   desc: 'ປັນຜົນດອກເບ້ຍ ຄຶ່ງປີ 2024' },
    { date: new Date('2024-12-31'), acc: ACC_SAVINGS2, code: TX_INTEREST,  amount: BigInt(325_000),   desc: 'ດອກເບ້ຍເງິນຝາກ ປີ 2024' },

    // ════════════════════════════════════════════════
    // ບັນຊີເງິນກູ້ — 12 transactions
    // ════════════════════════════════════════════════

    // ── ປ່ອຍກູ້ (1201) ──────────────────────────────
    // { date: new Date('2023-03-01'), acc: ACC_LOAN2,    code: TX_LOAN_DIS,  amount: BigInt(45_000_000), desc: 'ປ່ອຍກູ້ໃຫ້ ບຸນມີ ສີທັດ' },

    // ── ຊຳລະຕົ້ນທຶນ (1011) ──────────────────────────
    { date: new Date('2023-09-01'), acc: ACC_LOAN2,    code: TX_PRINCIPAL, amount: BigInt(1_250_000),  desc: 'ຊຳລະຕົ້ນທຶນ ງວດທີ 1' },
    { date: new Date('2023-12-01'), acc: ACC_LOAN2,    code: TX_PRINCIPAL, amount: BigInt(1_250_000),  desc: 'ຊຳລະຕົ້ນທຶນ ງວດທີ 2' },
    { date: new Date('2024-03-01'), acc: ACC_LOAN2,    code: TX_PRINCIPAL, amount: BigInt(1_250_000),  desc: 'ຊຳລະຕົ້ນທຶນ ງວດທີ 3' },
    { date: new Date('2024-06-01'), acc: ACC_LOAN2,    code: TX_PRINCIPAL, amount: BigInt(1_250_000),  desc: 'ຊຳລະຕົ້ນທຶນ ງວດທີ 4' },
    { date: new Date('2024-09-01'), acc: ACC_LOAN2,    code: TX_PRINCIPAL, amount: BigInt(1_250_000),  desc: 'ຊຳລະຕົ້ນທຶນ ງວດທີ 5' },
    { date: new Date('2024-12-01'), acc: ACC_LOAN2,    code: TX_PRINCIPAL, amount: BigInt(1_250_000),  desc: 'ຊຳລະຕົ້ນທຶນ ງວດທີ 6' },
    { date: new Date('2025-03-01'), acc: ACC_LOAN2,    code: TX_PRINCIPAL, amount: BigInt(1_250_000),  desc: 'ຊຳລະຕົ້ນທຶນ ງວດທີ 7' },

    // ── ຊຳລະດອກເບ້ຍ (1012) ──────────────────────────
    { date: new Date('2023-09-01'), acc: ACC_LOAN2,    code: TX_INT_PAY,   amount: BigInt(337_500),    desc: 'ຊຳລະດອກເບ້ຍ ງວດທີ 1' },
    { date: new Date('2023-12-01'), acc: ACC_LOAN2,    code: TX_INT_PAY,   amount: BigInt(337_500),    desc: 'ຊຳລະດອກເບ້ຍ ງວດທີ 2' },
    { date: new Date('2024-03-01'), acc: ACC_LOAN2,    code: TX_INT_PAY,   amount: BigInt(337_500),    desc: 'ຊຳລະດອກເບ້ຍ ງວດທີ 3' },
    { date: new Date('2024-06-01'), acc: ACC_LOAN2,    code: TX_INT_PAY,   amount: BigInt(337_500),    desc: 'ຊຳລະດອກເບ້ຍ ງວດທີ 4' },
    { date: new Date('2024-09-01'), acc: ACC_LOAN2,    code: TX_INT_PAY,   amount: BigInt(337_500),    desc: 'ຊຳລະດອກເບ້ຍ ງວດທີ 5' },
  ];

  let count = 0;
  for (const tx of txData) {
    const creditAcc = tx.acc === ACC_SAVINGS2 ? ACC_CASH2 : ACC_SAVINGS2;
    await prisma.transactions.create({
      data: {
        id:                randomUUID(),
        date:              tx.date,
        transactionCodeId: tx.code,
        amount:            tx.amount,
        debitAccNumber:    tx.acc,
        creditAccNumber:   creditAcc,
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
  console.log('  Client:  ບຸນມີ ສີທັດ / Bounmy Sithad');
  console.log(`  Login:   bankbookNumber=${CLIENT_BANKBOOK}  password=${CLIENT_PASSWORD}`);
  console.log(`  ເງິນຝາກ : ${ACC_SAVINGS2}`);
  console.log(`  ເງິນກູ້  : ${ACC_LOAN2}`);
  console.log('  TX codes: 2201=ຝາກ  2202=ຖອນ  2203=ປັນຜົນ  1011=ຕົ້ນທຶນ  1012=ດອກເບ້ຍ  1201=ປ່ອຍກູ້');
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
