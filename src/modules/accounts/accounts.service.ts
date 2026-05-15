import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(bankbookNumber: string, vbCode: string) {
    const [ownerRecords, clientAccount] = await Promise.all([
      this.prisma.accountOwner.findMany({
        where: { bankbookNumber, vbCode },
        select: {
          clientId: true,
          bankbookNumber: true,
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nickName: true,
              phoneNumber: true,
              genderLao: true,
              genderEng: true,
              birthDate: true,
              clientType: true,
            },
          },
        },
      }),
      this.prisma.clientAccount.findUnique({
        where: { bankbookNumber_vbCode: { bankbookNumber, vbCode } },
        select: { username: true },
      }),
    ]);

    const baseWhere = { accountOwners: { some: { bankbookNumber, vbCode } } };

    const [savingsRaw, loansRaw] = await Promise.all([
      this.prisma.accounts.findMany({
        where: { ...baseWhere, accTypeId: '9', statusId: '2' },
        select: {
          accNumber: true,
          accNameLao: true,
          accNameEng: true,
          currentBalance: true,
          statusId: true,
          accTypeId: true,
          vbCode: true,
          openingDate: true,
          vb: { select: { id: true, nameLao: true, nameEng: true } },
          accountType: { select: { id: true, nameLao: true, nameEng: true } },
        },
      }),
      this.prisma.accounts.findMany({
        where: { ...baseWhere, accTypeId: '5', statusId: '2' },
        select: {
          accNumber: true,
          accNameLao: true,
          accNameEng: true,
          currentBalance: true,
          statusId: true,
          accTypeId: true,
          vbCode: true,
          openingDate: true,
          vb: { select: { id: true, nameLao: true, nameEng: true } },
          accountType: { select: { id: true, nameLao: true, nameEng: true } },
        },
      }),
    ]);

    const loanAccNumbers = loansRaw.map((a) => a.accNumber);
    type LoanPurposeRow = { acc_number: string; name_eng: string; name_lao: string };
    let loanPurposeMap: Record<string, { nameEng: string; nameLao: string }> = {};
    if (loanAccNumbers.length > 0) {
      const rows = await this.prisma.$queryRaw<LoanPurposeRow[]>`
        SELECT
          cla.acc_number,
          clp.name_eng,
          clp.name_lao
        FROM client_loan_arrangement cla
        JOIN client_loan_rule clr ON clr.id = cla.client_loan_rule_id
        JOIN client_loan_purpose clp ON clp.id = clr.client_loan_purpose_id
        WHERE cla.acc_number = ANY(${loanAccNumbers})
        ORDER BY cla.id DESC
      `;
      for (const row of rows) {
        if (!loanPurposeMap[row.acc_number]) {
          loanPurposeMap[row.acc_number] = { nameEng: row.name_eng, nameLao: row.name_lao };
        }
      }
    }

    const mapAccount = (a: {
      accNumber: string;
      accNameLao: string | null;
      accNameEng: string | null;
      currentBalance: bigint;
      statusId: string;
      accTypeId: string | null;
      vbCode: string;
      openingDate: Date;
      vb: { id: string; nameLao: string | null; nameEng: string | null } | null;
      accountType: { id: string; nameLao: string | null; nameEng: string | null } | null;
    }, loanPurpose?: { nameEng: string; nameLao: string }) => ({
      accNumber: a.accNumber,
      accNameLao: loanPurpose?.nameLao || a.accNameLao,
      accNameEng: loanPurpose?.nameEng || a.accNameEng,
      currentBalance: Number(a.currentBalance),
      statusId: a.statusId,
      accTypeId: a.accTypeId,
      vbCode: a.vbCode,
      openingDate: a.openingDate,
      vb: a.vb,
      accountType: a.accountType?.nameLao || a.accountType?.nameEng || null,
    });

    const uniqueOwners = Object.values(
      Object.fromEntries(ownerRecords.map((r) => [r.clientId, r]))
    );

    return {
      bankbookNumber,
      vbCode,
      username: clientAccount?.username ?? null,
      accountOwners: uniqueOwners.map((r) => ({
        clientId: r.clientId,
        firstName: r.client?.firstName ?? null,
        lastName: r.client?.lastName ?? null,
        nickName: r.client?.nickName ?? null,
        phoneNumber: r.client?.phoneNumber ?? null,
        genderLao: r.client?.genderLao ?? null,
        genderEng: r.client?.genderEng ?? null,
        birthDate: r.client?.birthDate ?? null,
        clientType: r.client?.clientType ?? null,
      })),
      savingsAccounts: savingsRaw.map((a) => mapAccount(a)),
      loanAccounts: loansRaw.map((a) => mapAccount(a, loanPurposeMap[a.accNumber])),
    };
  }
}
