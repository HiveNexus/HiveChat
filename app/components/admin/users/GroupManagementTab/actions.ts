'use server';
import { groupModels, groups, llmModels } from '@/app/db/schema';
import { db } from '@/app/db';
import { eq, inArray } from 'drizzle-orm';
import { auth } from "@/auth";
import type { InferSelectModel } from 'drizzle-orm';
import { withTransaction } from '@/app/utils/db';

type GroupWithModels = Awaited<ReturnType<typeof db.query.groups.findMany>>[number] & {
  models: {
    model: {
      id: number;
      name: string;
      displayName: string;
      provider: {
        providerName: string;
        provider: string;
      };
    };
  }[];
}

type GroupModel = InferSelectModel<typeof llmModels>;
type GroupActionParams = {
  name: string;
  modelType?: 'all' | 'specific';
  models?: number[];
};


export async function getGroupList() {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const result = await db.query.groups.findMany({
      with: {
        models: {
          with: {
            model: {
              columns: {
                id: true,
                name: true,
                displayName: true,
                createdAt: true,
                updatedAt: true,
              },
              with: {
                provider: {
                  columns: {
                    providerName: true,
                    provider: true
                  }
                } as const
              }
            }
          }
        }
      },
      orderBy: (groups) => [groups.createdAt],
    });

    const groupsTableList = result.map(group => ({
      id: group.id,
      name: group.name,
      modelProviderList: (group as unknown as GroupWithModels).models.map(m => `${m.model.provider.providerName || 'unknown'} | ${m.model.displayName}`),
      models: (group as unknown as GroupWithModels).models.map(m => m.model.id),
      modelType: group.modelType,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      isDefault: group.isDefault,
    }))
    return groupsTableList;
  } catch (error) {
    throw new Error('query group list fail: \n' + error);
  }
}

export async function addGroup(groupInfo: { name: string, modelType?: 'all' | 'specific', models?: number[] }) {
  const session = await auth();
  if (!session?.user.isAdmin) throw new Error('Not allowed');

  let allModels: typeof llmModels.$inferSelect[] = []
  try {

    const [group] = await db.insert(groups).values({
      name: groupInfo.name,
      modelType: groupInfo.modelType,
    }).returning();

    if (groupInfo.modelType === 'specific' && groupInfo.models?.length) {
      const modelLinks = groupInfo.models.map(modelId => ({
        groupId: group.id,
        modelId
      }));

      return await withTransaction([
        db.insert(groupModels).values(modelLinks)
      ]);
    }
    return { success: true };


  } catch (error) {
    return {
      success: false,
      message: `Add failed: ${error instanceof Error ? error.message : error}`
    }
  }

}

export async function deleteGroup(groupId: string) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  try {
    const group = await db.query.groups.findFirst({
      where: eq(groups.id, groupId)
    });

    if (group?.isDefault) {
      return {
        success: false,
        message: 'Cannot delete default group'
      };
    }
    await db.delete(groups).where(eq(groups.id, groupId));
    return {
      success: true,
      message: 'delete success'
    }
  } catch (error) {
    return {
      success: false,
      message: 'delete fail'
    }
  }
}
export async function updateGroup2(groupId: string, groupInfo: {
  models?: number[];
  name: string;
  modelType: 'all' | 'specific';
}) {
  const session = await auth();
  if (!session?.user.isAdmin) {
    throw new Error('not allowed');
  }
  let allModels: typeof llmModels.$inferSelect[] = []
  try {
    if (groupInfo.modelType === 'all') {
      allModels = []
    } else if (groupInfo.models?.length) {
      allModels = await db.query.llmModels.findMany({
        where: (inArray(llmModels.id, groupInfo.models))
      })

    }
    await db.update(groups)
      .set({
        name: groupInfo.name,
        modelType: groupInfo.modelType
      })
      .where(eq(groups.id, groupId));
    await db.delete(groupModels)
      .where(eq(groupModels.groupId, groupId));
    if (allModels.length > 0) {
      await db.insert(groupModels)
        .values(
          allModels.map(model => ({
            groupId: groupId,
            modelId: model.id,
          }))
        )
    }
    return {
      success: true,
      message: 'update success'
    }
  } catch (error) {
    return {
      success: false,
      message: 'update fail \n' + error
    }
  }
}

export async function updateGroup(groupId: string, groupInfo: GroupActionParams) {
  const session = await auth();
  if (!session?.user.isAdmin) throw new Error('Not allowed');
  try {
    const operations: Promise<any>[] = [
      db.update(groups)
        .set({
          name: groupInfo.name,
          modelType: groupInfo.modelType,
        })
        .where(eq(groups.id, groupId)),
      db.delete(groupModels)
        .where(eq(groupModels.groupId, groupId)),
    ]
    if (groupInfo.modelType === 'specific' && groupInfo.models?.length) {
      const modelLinks = groupInfo.models.map(modelId => ({
        groupId: groupId,
        modelId
      }));
      operations.push(db.insert(groupModels).values(modelLinks));

    }
    return await withTransaction(operations);

  } catch (error) {
    return {
      success: false,
      message: `Update failed: ${error instanceof Error ? error.message : error}`
    };
  }

}