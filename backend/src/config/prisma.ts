import { PrismaClient } from '@prisma/client';
import { IS_PRODUCTION } from './env';

const prismaGlobal = global as unknown as { prisma: PrismaClient };

export const prisma =
    prismaGlobal.prisma ||
    new PrismaClient({
        log: IS_PRODUCTION ? ['error'] : ['query', 'error', 'warn'],
    });

if (!IS_PRODUCTION) prismaGlobal.prisma = prisma;
