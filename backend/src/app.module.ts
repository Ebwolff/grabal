import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantInterceptor } from './interceptors/tenant.interceptor';
import { AuditModule } from './modules/audit/audit.module';
import { EngineModule } from './modules/engine/engine.module';
import { DataModule } from './modules/data/data.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AuditModule,
    EngineModule,
    DataModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_INTERCEPTOR, useClass: TenantInterceptor },
  ],
})
export class AppModule {}
