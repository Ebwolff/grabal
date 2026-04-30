import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantMiddleware } from './middleware/tenant.middleware';
import { AuditModule } from './modules/audit/audit.module';
import { EngineModule } from './modules/engine/engine.module';
import { DataModule } from './modules/data/data.module';

@Module({
  imports: [PrismaModule, AuthModule, UsersModule, AuditModule, EngineModule, DataModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
