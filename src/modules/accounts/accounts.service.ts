import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(clientId: string) {
    const ownerRecord = await this.prisma.accountOwner.findFirst({
      where: { clientId },
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
    });

    const accounts = await this.prisma.accounts.findMany({
      where: {
        accountOwners: { some: { clientId } },
      },
      select: {
        accNumber: true,
        accNameLao: true,
        accNameEng: true,
        currentBalance: true,
        statusId: true,
        vbCode: true,
        openingDate: true,
        vb: { select: { id: true, nameLao: true, nameEng: true } },
        accountType: { select: { id: true, nameLao: true, nameEng: true } },
      },
    });

    return {
      accountOwner: ownerRecord ?? null,
      myAccounts: accounts.map((a) => ({
        accNumber: a.accNumber,
        accNameLao: a.accNameLao,
        accNameEng: a.accNameEng,
        currentBalance: Number(a.currentBalance),
        statusId: a.statusId,
        vbCode: a.vbCode,
        openingDate: a.openingDate,
        vb: a.vb,
        accountType: a.accountType?.nameLao || a.accountType?.nameEng || null,
      })),
    };
  }
}
