import { PrismaClient } from '@prisma/client';


export const prisma = new PrismaClient();

// Setup: Ensure DB is migration-ready (using dev DB for now, or use a separate test DB URL in env)
// Ideally, we should use a separate test database.
// For this environment, we'll assume the user might want to run tests against a local test DB.
// But safely, we should just connect. The user is responsible for supplying TEST_DATABASE_URL if they want isolation.

export async function setupTestDb() {
    // Optional: Run migrations if needed
    // execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    await prisma.$connect();
}

export async function teardownTestDb() {
    await prisma.$disconnect();
}

export async function clearDb() {
    const tablenames = await prisma.$queryRaw<
        Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
        .map(({ tablename }: { tablename: string }) => tablename)
        .filter((name: string) => name !== '_prisma_migrations')
        .map((name: string) => `"public"."${name}"`)
        .join(', ');

    if (tables.length > 0) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
        } catch (error) {
            console.log({ error });
        }
    }
}
