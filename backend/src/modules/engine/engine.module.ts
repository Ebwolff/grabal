import { Module } from '@nestjs/common';
import { EngineService } from './engine.service';
import { ProductionEngineService } from './services/production-engine.service';
import { FinanceEngineService } from './services/finance-engine.service';
import { RatingEngineService } from './services/rating-engine.service';

@Module({
  providers: [
    EngineService,
    ProductionEngineService,
    FinanceEngineService,
    RatingEngineService,
  ],
  exports: [
    EngineService,
    ProductionEngineService,
    FinanceEngineService,
    RatingEngineService,
  ],
})
export class EngineModule {}
