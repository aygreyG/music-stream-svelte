import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

import { PrismaClient } from '../../generated/prisma-client/client';

const adapter = new PrismaBetterSqlite3({ url: 'file:./db/app.db' });
const prisma = new PrismaClient({ adapter });
export default prisma;
