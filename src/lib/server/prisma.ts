import { PrismaClient } from '../../generated/prisma-client/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'file:./db/app.db' });
const prisma = new PrismaClient({ adapter });
export default prisma;
