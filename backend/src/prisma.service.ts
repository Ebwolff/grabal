import 'dotenv/config';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { tenantStorage } from './interceptors/tenant.interceptor';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
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
              'Producer',
              'Farm',
              'Safra',
              'Cultura',
              'Production',
              'Cost',
              'Revenue',
              'Asset',
              'Liability',
              'CPR',
              'Guarantee',
            ];

            if (economicGroupId && multiTenantModels.includes(model)) {
              if (
                [
                  'findMany',
                  'findFirst',
                  'findUnique',
                  'count',
                  'update',
                  'delete',
                  'updateMany',
                  'deleteMany',
                ].includes(operation)
              ) {
                // @ts-expect-error - dynamic Prisma args typing across all models
                args.where = { ...args.where, economicGroupId };
              }
              if (operation === 'create' || operation === 'createMany') {
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
