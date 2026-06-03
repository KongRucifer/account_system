import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import {
  getPrismaPagination,
  createPrismaPaginatedResponse,
} from '../../common/utils/prisma-pagination.util';
import { VbCodeQueryDto, AccountOwnerQueryDto } from './dto/vbcode-query.dto';

/** Shape returned for a single village bank (vbcode) row. */
export interface VbCodeListItem {
  vbCode: string;
  nameLao: string;
  nameEng: string;
  provinceId: string;
  provinceName: string | null;
  districtId: string;
  districtName: string | null;
  villageBankName: string | null;
  foundingDate: Date | null;
  statusId: string | null;
  clientCount: number;
  accountOwnerCount: number;
}

/** Shape returned for one account owner (account_owner joined with client + account). */
export interface AccountOwnerItem {
  bankbookNumber: string;
  accNumber: string;
  vbCode: string;
  clientId: string;
  clientName: string; // resolved name instead of the raw id
  accNameLao: string | null;
  accNameEng: string | null;
  currentBalance: number;
  accountType: string | null;
  statusId: string | null;
}

@Injectable()
export class VillageDataService {
  constructor(private readonly prisma: PrismaService) {}

  private fullName(c: {
    firstName: string | null;
    lastName: string | null;
    nickName: string | null;
  }): string {
    const parts = [c.firstName, c.lastName].filter(Boolean);
    if (parts.length) return parts.join(' ');
    return c.nickName ?? '(no name)';
  }

  // ── 1. VbCode list — paginated + search by code / name ──────────────────────
  async listVbCodes(query: VbCodeQueryDto): Promise<PaginatedResult<VbCodeListItem>> {
    const { skip, take, page, limit } = getPrismaPagination(query.page, query.limit);
    const search = query.search?.trim();

    const where = search
      ? {
          OR: [
            { id: { contains: search, mode: 'insensitive' as const } },
            { nameLao: { contains: search, mode: 'insensitive' as const } },
            { nameEng: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [rows, total] = await Promise.all([
      this.prisma.vbCode.findMany({
        where,
        skip,
        take,
        orderBy: { id: 'asc' },
        include: {
          province: { select: { nameLao: true, nameEng: true } },
          district: { select: { nameLao: true, nameEng: true } },
          villageBank: { select: { nameLao: true, foundingDate: true, statusId: true } },
          _count: { select: { clients: true, accountOwners: true } },
        },
      }),
      this.prisma.vbCode.count({ where }),
    ]);

    const results: VbCodeListItem[] = rows.map((r) => ({
      vbCode: r.id,
      nameLao: r.nameLao,
      nameEng: r.nameEng,
      provinceId: r.provinceId,
      provinceName: r.province?.nameLao ?? r.province?.nameEng ?? null,
      districtId: r.districtId,
      districtName: r.district?.nameLao ?? r.district?.nameEng ?? null,
      villageBankName: r.villageBank?.nameLao ?? null,
      foundingDate: r.villageBank?.foundingDate ?? null,
      statusId: r.villageBank?.statusId ?? null,
      clientCount: r._count.clients,
      accountOwnerCount: r._count.accountOwners,
    }));

    return createPrismaPaginatedResponse(results, total, page, limit, 'VbCodes fetched successfully');
  }

  // ── 2. Single VbCode detail ─────────────────────────────────────────────────
  async getVbCode(vbCode: string): Promise<VbCodeListItem> {
    const r = await this.prisma.vbCode.findUnique({
      where: { id: vbCode },
      include: {
        province: { select: { nameLao: true, nameEng: true } },
        district: { select: { nameLao: true, nameEng: true } },
        villageBank: { select: { nameLao: true, foundingDate: true, statusId: true } },
        _count: { select: { clients: true, accountOwners: true } },
      },
    });

    if (!r) {
      throw new NotFoundException(`VbCode ${vbCode} not found`);
    }

    return {
      vbCode: r.id,
      nameLao: r.nameLao,
      nameEng: r.nameEng,
      provinceId: r.provinceId,
      provinceName: r.province?.nameLao ?? r.province?.nameEng ?? null,
      districtId: r.districtId,
      districtName: r.district?.nameLao ?? r.district?.nameEng ?? null,
      villageBankName: r.villageBank?.nameLao ?? null,
      foundingDate: r.villageBank?.foundingDate ?? null,
      statusId: r.villageBank?.statusId ?? null,
      clientCount: r._count.clients,
      accountOwnerCount: r._count.accountOwners,
    };
  }

  // ── 3. AccountOwner list — by vbCode (+ optional bankbookNumber) ─────────────
  async listAccountOwners(
    query: AccountOwnerQueryDto,
  ): Promise<PaginatedResult<AccountOwnerItem>> {
    const { skip, take, page, limit } = getPrismaPagination(query.page, query.limit);

    const where: any = {};
    if (query.vbCode?.trim()) where.vbCode = query.vbCode.trim();
    if (query.bankbookNumber?.trim()) where.bankbookNumber = query.bankbookNumber.trim();

    const [rows, total] = await Promise.all([
      this.prisma.accountOwner.findMany({
        where,
        skip,
        take,
        orderBy: [{ bankbookNumber: 'asc' }, { accNumber: 'asc' }],
        include: {
          client: { select: { firstName: true, lastName: true, nickName: true } },
          account: {
            select: {
              accNameLao: true,
              accNameEng: true,
              currentBalance: true,
              statusId: true,
              accountType: { select: { nameLao: true, nameEng: true } },
            },
          },
        },
      }),
      this.prisma.accountOwner.count({ where }),
    ]);

    const results: AccountOwnerItem[] = rows.map((r) => ({
      bankbookNumber: r.bankbookNumber,
      accNumber: r.accNumber,
      vbCode: r.vbCode,
      clientId: r.clientId,
      clientName: this.fullName(r.client),
      accNameLao: r.account?.accNameLao ?? null,
      accNameEng: r.account?.accNameEng ?? null,
      currentBalance: r.account ? Number(r.account.currentBalance) : 0,
      accountType: r.account?.accountType?.nameLao ?? r.account?.accountType?.nameEng ?? null,
      statusId: r.account?.statusId ?? null,
    }));

    return createPrismaPaginatedResponse(
      results,
      total,
      page,
      limit,
      'Account owners fetched successfully',
    );
  }

  // ── 4. Sync snapshot — full dataset for offline SQLite caching ──────────────
  // The Flutter app pulls this when online and mirrors it into SQLite so that
  // login / search / detail keep working with no internet. `since` (ISO date)
  // lets the app pull only rows changed after its last successful sync.
  async getSyncSnapshot(since?: string): Promise<{
    serverTime: string;
    sinceApplied: string | null;
    vbCodes: VbCodeListItem[];
    accountOwners: AccountOwnerItem[];
  }> {
    const serverTime = new Date().toISOString();
    const sinceDate = since ? new Date(since) : null;
    const validSince = sinceDate && !isNaN(sinceDate.getTime()) ? sinceDate : null;

    // For incremental sync we use the `synchronized` timestamp present on these
    // tables. Rows with a NULL `synchronized` are always included (never synced).
    const ownerWhere = validSince
      ? { OR: [{ synchronized: { gte: validSince } }, { synchronized: null }] }
      : {};

    const [vbRows, ownerRows] = await Promise.all([
      this.prisma.vbCode.findMany({
        orderBy: { id: 'asc' },
        include: {
          province: { select: { nameLao: true, nameEng: true } },
          district: { select: { nameLao: true, nameEng: true } },
          villageBank: { select: { nameLao: true, foundingDate: true, statusId: true } },
          _count: { select: { clients: true, accountOwners: true } },
        },
      }),
      this.prisma.accountOwner.findMany({
        where: ownerWhere,
        orderBy: [{ vbCode: 'asc' }, { bankbookNumber: 'asc' }, { accNumber: 'asc' }],
        include: {
          client: { select: { firstName: true, lastName: true, nickName: true } },
          account: {
            select: {
              accNameLao: true,
              accNameEng: true,
              currentBalance: true,
              statusId: true,
              accountType: { select: { nameLao: true, nameEng: true } },
            },
          },
        },
      }),
    ]);

    return {
      serverTime,
      sinceApplied: validSince ? validSince.toISOString() : null,
      vbCodes: vbRows.map((r) => ({
        vbCode: r.id,
        nameLao: r.nameLao,
        nameEng: r.nameEng,
        provinceId: r.provinceId,
        provinceName: r.province?.nameLao ?? r.province?.nameEng ?? null,
        districtId: r.districtId,
        districtName: r.district?.nameLao ?? r.district?.nameEng ?? null,
        villageBankName: r.villageBank?.nameLao ?? null,
        foundingDate: r.villageBank?.foundingDate ?? null,
        statusId: r.villageBank?.statusId ?? null,
        clientCount: r._count.clients,
        accountOwnerCount: r._count.accountOwners,
      })),
      accountOwners: ownerRows.map((r) => ({
        bankbookNumber: r.bankbookNumber,
        accNumber: r.accNumber,
        vbCode: r.vbCode,
        clientId: r.clientId,
        clientName: this.fullName(r.client),
        accNameLao: r.account?.accNameLao ?? null,
        accNameEng: r.account?.accNameEng ?? null,
        currentBalance: r.account ? Number(r.account.currentBalance) : 0,
        accountType: r.account?.accountType?.nameLao ?? r.account?.accountType?.nameEng ?? null,
        statusId: r.account?.statusId ?? null,
      })),
    };
  }
}
