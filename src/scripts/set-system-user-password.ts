/**
 * Helper for testing /auth/login-test.
 *
 *  - With no args: lists the first 20 system_user rows (id, user_name, has password?).
 *  - With args:    sets a bcrypt password for the given user_name.
 *
 * List:  npx ts-node -r tsconfig-paths/register src/scripts/set-system-user-password.ts
 * Set:   npx ts-node -r tsconfig-paths/register src/scripts/set-system-user-password.ts <userName> <password>
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const [userName, password] = process.argv.slice(2);

  if (!userName || !password) {
    const users = await prisma.systemUser.findMany({
      take: 20,
      orderBy: { id: 'asc' },
      select: { id: true, userName: true, password: true, statusId: true },
    });
    console.log('\nSystem users (first 20):');
    console.table(
      users.map((u) => ({
        id: u.id,
        userName: u.userName,
        hasPassword: !!u.password,
        status: u.statusId,
      })),
    );
    console.log(
      '\nTo set a password:\n  npx ts-node -r tsconfig-paths/register src/scripts/set-system-user-password.ts <userName> <password>\n',
    );
    return;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.systemUser.findFirst({ where: { userName } });

  if (user) {
    await prisma.systemUser.update({
      where: { id: user.id },
      data: { password: hashed },
    });
    console.log(`✅  Password updated for existing "${userName}" (id=${user.id}).`);
  } else {
    // Create a new system_user. statusId must reference an existing status row;
    // reuse the status of any existing user, else fall back to the first status.
    const anyUser = await prisma.systemUser.findFirst({ select: { statusId: true } });
    const statusId =
      anyUser?.statusId ?? (await prisma.status.findFirst())?.id;
    if (!statusId) {
      throw new Error('No status rows found — cannot create a system_user.');
    }
    const created = await prisma.systemUser.create({
      data: { userName, password: hashed, statusId },
    });
    console.log(`✅  Created new system_user "${userName}" (id=${created.id}, status=${statusId}).`);
  }
  console.log(`    Login test: POST /api/v1/auth/login-test  { "userName": "${userName}", "password": "${password}" }`);
}

main()
  .catch((e) => {
    console.error('❌ ', e.message ?? e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
