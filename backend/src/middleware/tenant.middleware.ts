import { Injectable, NestMiddleware } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantStorage = new AsyncLocalStorage<{ economicGroupId: string }>();

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const economicGroupId = req.user?.economicGroupId || req.headers['x-tenant-id'];
    
    tenantStorage.run({ economicGroupId }, () => {
      next();
    });
  }
}
