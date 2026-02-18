import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export type PrismaTransactionalClient = Parameters<
    Parameters<PrismaClient['$transaction']>[0]>[0];

export default prismaClient;
