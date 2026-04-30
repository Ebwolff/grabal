import { Module } from '@nestjs/common';
import { DataService } from './data.service';
import { DataController } from './data.controller';
import { EngineModule } from '../engine/engine.module';

@Module({
  imports: [EngineModule],
  providers: [DataService],
  controllers: [DataController],
})
export class DataModule {}
