import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { Observable } from 'rxjs';

export const tenantStorage = new AsyncLocalStorage<{
  economicGroupId?: string;
}>();

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const economicGroupId = request.user?.economicGroupId;

    return new Observable((subscriber) => {
      tenantStorage.run({ economicGroupId }, () => {
        next.handle().subscribe(subscriber);
      });
    });
  }
}
