import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { db } from './index';
import { groups } from './schema';
// 在数据库初始化时检查并创建默认分组
export async function createDefaultGroups() {
    await db.transaction(async (tx) => {
        const defaultGroup = await tx.query.groups.findFirst({
            where: eq(groups.isDefault, true)
        });

        if (!defaultGroup) {
            await tx.insert(groups).values({
                name: '默认分组',
                modelType: 'all',
                isDefault: true
            });
        }
    });
}

// 添加详细的错误处理
createDefaultGroups()
    .then(() => {
        console.log("Groups initialized successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Initialization failed:");
        console.error(error instanceof Error ? error.stack : error);
        process.exit(1);
    });