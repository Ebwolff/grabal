import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantStorage } from './middleware/tenant.middleware';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    console.log('CONSTRUTOR PRISMA: DATABASE_URL =', process.env.DATABASE_URL);
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  // Extensão para isolamento Multi-tenancy automático
  get extended() {
    return this.$extends({
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const context = tenantStorage.getStore();
            const economicGroupId = context?.economicGroupId;

            // Modelos que devem ser filtrados por tenant
            const multiTenantModels = [
              'Producer', 'Farm', 'Safra', 'Cultura', 
              'Production', 'Cost', 'Revenue', 
              'Asset', 'Liability', 'CPR', 'Guarantee'
            ];

            if (economicGroupId && multiTenantModels.includes(model)) {
              if (['findMany', 'findFirst', 'findUnique', 'count', 'update', 'delete', 'updateMany', 'deleteMany'].includes(operation)) {
                 // @ts-ignore
                args.where = { ...args.where, economicGroupId };
              }
              if (operation === 'create' || operation === 'createMany') {
                 // @ts-ignore
                args.data = { ...args.data, economicGroupId };
              }
            }

            return query(args);
          },
        },
      },
    });
  }
}
