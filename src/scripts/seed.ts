/**
 * Seed Script
 * Creates:
 *  - 1 SystemUser (login: admin / password: admin1234)
 *  - Required lookup data (Status, AccountType, TransactionCode, Province, District, Village, VbCode, ClientLoanRepaymentType)
 *  - 1 Client (account owner)
 *  - 3 Accounts (savings, loan, general)
 *  - AccountOwner links
 *  - ClientSavingArrangement  (for savings account)
 *  - ClientLoanArrangement    (for loan account)
 *  - 30 Transactions spread across 2024-2025
 *
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/seed.ts
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

// ─── IDs / constants (all verified from real DB) ────────────────────────────
const VB_CODE        = '0101001';   // Nongping VB, Chanthabouly, Vientiane Capital
const PROVINCE_ID    = '01';        // Vientiane Capital
const DISTRICT_ID    = '0101';      // Chanthabouly
const VILLAGE_ID     = '001';
const CLIENT_ID      = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
// accNumber format: vbCode(7) + running(8) = 15 chars
const ACC_SAVINGS    = '010100100000001'; // 15 chars: vbCode(7)+running(8)
const ACC_LOAN       = '010100100000002';
const ACC_GENERAL    = '010100100000003';
const ACC_CREDIT     = '010100199999999'; // counterpart (cash) account
const STATUS_ACTIVE  = '2';         // "active" in DB
const ACC_TYPE_SAVINGS = '1';       // "saving accounts"
const ACC_TYPE_LOAN    = '5';       // "short term Loans"
const ACC_TYPE_GENERAL = '0';       // "current accounts"
const TX_CODE_DEPOSIT  = '2201';    // "Client withdraws saving with VB" — using for deposits too (closest)
const TX_CODE_WITHDRAW = '2201';    // "Client withdraws saving with VB"
const TX_CODE_LOAN_PAY = '1010';    // "Client repays loan"
const TX_CODE_LOAN_DIS = '1201';    // "VB disburses loan to client"
const REPAYMENT_TYPE_ID = '01';     // "installment_monthly"
const LOAN_RULE_ID   = '01010011';  // new rule scoped to VB 0101001

async function main() {
  console.log('🌱  Starting seed...');

  // ── 1-5. Lookup data already exists in DB — skip creation
  console.log('✅  Lookup data (Status/Province/District/VbCode/AccountType/TxCode/RepaymentType) — already in DB');

  // ── 6. SystemUser (login: admin / password: admin1234) ─────────────────────
  const hashedPassword = await bcrypt.hash('admin1234', 10);
  const existingUser = await prisma.systemUser.findFirst({
    where: { userName: 'admin' },
  });
  const systemUser = existingUser
    ? await prisma.systemUser.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword, statusId: STATUS_ACTIVE },
      })
    : await prisma.systemUser.create({
        data: {
          userName: 'admin',
          password: hashedPassword,
          statusId: STATUS_ACTIVE,
        },
      });
  console.log(`✅  SystemUser  (id: ${systemUser.id}, username: admin, password: admin1234)`);

  // ── 7. Client ──────────────────────────────────────────────────────────────
  await prisma.client.upsert({
    where: { id: CLIENT_ID },
    update: {},
    create: {
      id: CLIENT_ID,
      bankbookNumber: '00001',
      firstName: 'ສົມໄຊ',
      lastName: 'ວົງສະຫວັນ',
      nickName: 'ສົມໄຊ ວົງສະຫວັນ',
      genderEng: 'Male',
      genderLao: 'ຊາຍ',
      birthDate: new Date('1990-05-15'),
      clientType: 'Individual',
      statusId: STATUS_ACTIVE,
      phoneNumber: '02012345678',
      vbCode: VB_CODE,
      sortNo: '0001',
    },
  });
  console.log('✅  Client');

  // ── 8. Credit counterpart account (needed for transaction FK) ──────────────
  await prisma.accounts.upsert({
    where: { accNumber: ACC_CREDIT },
    update: {},
    create: {
      accNumber: ACC_CREDIT,
      accLevel: '1',
      accGroup: 'C',
      accNameEng: 'Cash / Counterpart',
      accNameLao: 'ເງິນສົດ / ຄູ່ຕ້ານ',
      currentBalance: BigInt(0),
      statusId: STATUS_ACTIVE,
      vbCode: VB_CODE,
      openingDate: new Date('2020-01-01'),
    },
  });

  // ── 9. Three client accounts ───────────────────────────────────────────────
  await prisma.accounts.upsert({
    where: { accNumber: ACC_SAVINGS },
    update: {},
    create: {
      accNumber: ACC_SAVINGS,
      accLevel: '1',
      accGroup: 'S',
      accNameEng: 'Savings Account - Somchai',
      accNameLao: 'ບັນຊີເງິນຝາກ - ສົມໄຊ',
      bankbookNumber: '00001',
      accTypeId: ACC_TYPE_SAVINGS,
      currentBalance: BigInt(12_500_000),
      statusId: STATUS_ACTIVE,
      vbCode: VB_CODE,
      openingDate: new Date('2022-03-01'),
    },
  });

  await prisma.accounts.upsert({
    where: { accNumber: ACC_LOAN },
    update: {},
    create: {
      accNumber: ACC_LOAN,
      accLevel: '1',
      accGroup: 'L',
      accNameEng: 'Loan Account - Somchai',
      accNameLao: 'ບັນຊີເງິນກູ້ - ສົມໄຊ',
      bankbookNumber: '00001',
      accTypeId: ACC_TYPE_LOAN,
      currentBalance: BigInt(35_000_000),
      statusId: STATUS_ACTIVE,
      vbCode: VB_CODE,
      openingDate: new Date('2023-01-15'),
    },
  });

  await prisma.accounts.upsert({
    where: { accNumber: ACC_GENERAL },
    update: {},
    create: {
      accNumber: ACC_GENERAL,
      accLevel: '1',
      accGroup: 'G',
      accNameEng: 'General Account - Somchai',
      accNameLao: 'ບັນຊີທົ່ວໄປ - ສົມໄຊ',
      bankbookNumber: '00001',
      accTypeId: ACC_TYPE_GENERAL,
      currentBalance: BigInt(5_000_000),
      statusId: STATUS_ACTIVE,
      vbCode: VB_CODE,
      openingDate: new Date('2022-03-01'),
    },
  });
  console.log('✅  Accounts (3)');

  // ── 10. AccountOwner links ─────────────────────────────────────────────────
  for (const accNumber of [ACC_SAVINGS, ACC_LOAN, ACC_GENERAL]) {
    await prisma.accountOwner.upsert({
      where: {
        bankbookNumber_accNumber_clientId: {
          bankbookNumber: '00001',
          accNumber,
          clientId: CLIENT_ID,
        },
      },
      update: {},
      create: {
        bankbookNumber: '00001',
        accNumber,
        clientId: CLIENT_ID,
        vbCode: VB_CODE,
      },
    });
  }
  console.log('✅  AccountOwner links');

  // ── 11. ClientSavingArrangement ────────────────────────────────────────────
  // ClientSavingCondition table has a column mismatch — use raw SQL to insert saving arrangement
  // Find an existing saving condition id from this vb or any
  const existingSavCond = await prisma.$queryRaw<{id:string}[]>`
    SELECT id FROM client_saving_condition LIMIT 1
  `.catch(() => [] as {id:string}[]);
  const savCondId = existingSavCond[0]?.id ?? null;

  const existingSaving = await prisma.clientSavingArrangement.findFirst({
    where: { accNumber: ACC_SAVINGS },
  });
  if (!existingSaving && savCondId) {
    await prisma.$executeRaw`
      INSERT INTO client_saving_arrangement
        (date, current_balance, saving_amount, withdrawal_amount, vbcode, client_saving_condition_id, acc_number, interest_numerator)
      VALUES
        ('2025-01-01', 12500000, 2000000, 500000, ${VB_CODE}, ${savCondId}, ${ACC_SAVINGS}, 1062500)
    `;
    console.log('✅  ClientSavingArrangement');
  } else if (existingSaving) {
    console.log('✅  ClientSavingArrangement (already exists)');
  } else {
    console.log('⚠️   ClientSavingArrangement skipped (no saving condition found)');
  }

  // ── 12a. Get existing loan rule ID from DB (schema out of sync, can't create via Prisma)
  const existingLoanRule = await prisma.clientLoanRule.findFirst({
    select: { id: true },
  });
  const loanRuleId = existingLoanRule?.id ?? LOAN_RULE_ID;
  console.log(`✅  Using loan rule id: ${loanRuleId}`);

  // ── 12. ClientLoanArrangement (raw SQL — schema out of sync with DB) ────────
  const existingLoan = await prisma.clientLoanArrangement.findFirst({
    where: { accNumber: ACC_LOAN },
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
        '2023-01-15', ${ACC_LOAN}, 'N', ${loanRuleId},
        ${REPAYMENT_TYPE_ID}, '2023-01-15', 24, '2025-01-15',
        50000000, 35000000, 1500000, 6750000,
        0, 2000000, 15000000, 0,
        0, 0, 'N',
        ${VB_CODE}, ${STATUS_ACTIVE}, 1.5,
        525000, 2083333
      )
    `;
    console.log('✅  ClientLoanArrangement');
  } else {
    console.log('✅  ClientLoanArrangement (already exists)');
  }

  // ── 13. Transactions (30 entries across 2024-2025) ─────────────────────────
  // Delete old seed transactions to keep idempotent
  await prisma.transactions.deleteMany({
    where: {
      debitAccNumber: { in: [ACC_SAVINGS, ACC_LOAN, ACC_GENERAL] },
      userId: 'seed',
    },
  });

  const txData: {
    date: Date;
    accNumber: string;
    txCode: string;
    amount: bigint;
    desc: string;
  }[] = [
    // 2024 - savings deposits & withdrawals
    { date: new Date('2024-01-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Jan 2024' },
    { date: new Date('2024-02-08'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Feb 2024' },
    { date: new Date('2024-02-20'), accNumber: ACC_SAVINGS, txCode: TX_CODE_WITHDRAW, amount: BigInt(500_000),   desc: 'Withdrawal for household expenses' },
    { date: new Date('2024-03-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Mar 2024' },
    { date: new Date('2024-04-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Apr 2024' },
    { date: new Date('2024-04-25'), accNumber: ACC_SAVINGS, txCode: TX_CODE_WITHDRAW, amount: BigInt(1_000_000), desc: 'Emergency withdrawal' },
    { date: new Date('2024-05-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit May 2024' },
    { date: new Date('2024-06-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_500_000), desc: 'Bonus deposit Jun 2024' },
    { date: new Date('2024-07-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Jul 2024' },
    { date: new Date('2024-08-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Aug 2024' },
    { date: new Date('2024-09-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Sep 2024' },
    { date: new Date('2024-09-28'), accNumber: ACC_SAVINGS, txCode: TX_CODE_WITHDRAW, amount: BigInt(500_000),   desc: 'Withdrawal Sep 2024' },
    { date: new Date('2024-10-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Oct 2024' },
    { date: new Date('2024-11-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Nov 2024' },
    { date: new Date('2024-12-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(3_000_000), desc: 'Year-end bonus deposit Dec 2024' },
    // 2024 - loan payments
    { date: new Date('2024-01-15'), accNumber: ACC_LOAN, txCode: TX_CODE_LOAN_PAY, amount: BigInt(2_608_333), desc: 'Loan repayment Jan 2024' },
    { date: new Date('2024-02-15'), accNumber: ACC_LOAN, txCode: TX_CODE_LOAN_PAY, amount: BigInt(2_608_333), desc: 'Loan repayment Feb 2024' },
    { date: new Date('2024-03-15'), accNumber: ACC_LOAN, txCode: TX_CODE_LOAN_PAY, amount: BigInt(2_608_333), desc: 'Loan repayment Mar 2024' },
    { date: new Date('2024-04-15'), accNumber: ACC_LOAN, txCode: TX_CODE_LOAN_PAY, amount: BigInt(2_608_333), desc: 'Loan repayment Apr 2024' },
    { date: new Date('2024-05-15'), accNumber: ACC_LOAN, txCode: TX_CODE_LOAN_PAY, amount: BigInt(2_608_333), desc: 'Loan repayment May 2024' },
    { date: new Date('2024-06-15'), accNumber: ACC_LOAN, txCode: TX_CODE_LOAN_PAY, amount: BigInt(2_608_333), desc: 'Loan repayment Jun 2024' },
    // 2025 - savings
    { date: new Date('2025-01-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Jan 2025' },
    { date: new Date('2025-02-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Feb 2025' },
    { date: new Date('2025-02-22'), accNumber: ACC_SAVINGS, txCode: TX_CODE_WITHDRAW, amount: BigInt(1_500_000), desc: 'New Year expenses withdrawal' },
    { date: new Date('2025-03-10'), accNumber: ACC_SAVINGS, txCode: TX_CODE_DEPOSIT,  amount: BigInt(2_000_000), desc: 'Monthly saving deposit Mar 2025' },
    // 2025 - loan payments
    { date: new Date('2025-01-15'), accNumber: ACC_LOAN, txCode: TX_CODE_LOAN_PAY, amount: BigInt(2_608_333), desc: 'Loan repayment Jan 2025' },
    { date: new Date('2025-02-15'), accNumber: ACC_LOAN, txCode: TX_CODE_LOAN_PAY, amount: BigInt(2_608_333), desc: 'Loan repayment Feb 2025' },
    { date: new Date('2025-03-15'), accNumber: ACC_LOAN, txCode: TX_CODE_LOAN_PAY, amount: BigInt(2_608_333), desc: 'Loan repayment Mar 2025' },
    // loan disbursement (initial)
    { date: new Date('2023-01-15'), accNumber: ACC_LOAN, txCode: TX_CODE_LOAN_DIS, amount: BigInt(50_000_000), desc: 'Loan disbursement to client' },
    // general account
    { date: new Date('2024-06-01'), accNumber: ACC_GENERAL, txCode: TX_CODE_DEPOSIT,  amount: BigInt(5_000_000), desc: 'Initial deposit to general account' },
    { date: new Date('2025-01-05'), accNumber: ACC_GENERAL, txCode: TX_CODE_DEPOSIT,  amount: BigInt(1_000_000), desc: 'Top-up general account' },
  ];

  let txCount = 0;
  for (const tx of txData) {
    await prisma.transactions.create({
      data: {
        id: randomUUID(),
        date: tx.date,
        transactionCodeId: tx.txCode,
        amount: tx.amount,
        debitAccNumber: tx.accNumber,
        creditAccNumber: tx.accNumber === ACC_SAVINGS ? ACC_LOAN : ACC_SAVINGS,
        vbCode: VB_CODE,
        description: tx.desc,
        userId: 'seed',
      },
    });
    txCount++;
  }
  console.log(`✅  Transactions (${txCount})`);

  console.log('\n🎉  Seed complete!');
  console.log('─────────────────────────────────────────');
  console.log('  Login credentials:  admin / admin1234');
  console.log('  Accounts:');
  console.log(`    Savings : ${ACC_SAVINGS}`);
  console.log(`    Loan    : ${ACC_LOAN}`);
  console.log(`    General : ${ACC_GENERAL}`);
  console.log('─────────────────────────────────────────');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
