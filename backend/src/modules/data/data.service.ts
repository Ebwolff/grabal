import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { AuditService } from '../audit/audit.service';
import { Producer, Farm, Safra, Prisma } from '@prisma/client';
import { FinanceEngineService } from '../engine/services/finance-engine.service';
import { RatingEngineService, Rating } from '../engine/services/rating-engine.service';

@Injectable()
export class DataService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private financeEngine: FinanceEngineService,
    private ratingEngine: RatingEngineService,
  ) {}

  // PRODUCERS
  async createProducer(data: Prisma.ProducerCreateInput, userId: string): Promise<Producer> {
    const producer = await this.prisma.extended.producer.create({ data });
    await this.audit.log({
      userId,
      action: 'CREATE',
      model: 'Producer',
      recordId: producer.id,
      newData: producer,
      economicGroupId: producer.economicGroupId,
    });
    return producer;
  }

  async findAllProducers(): Promise<Producer[]> {
    return this.prisma.extended.producer.findMany();
  }

  // FARMS
  async createFarm(data: Prisma.FarmCreateInput, userId: string): Promise<Farm> {
    const farm = await this.prisma.extended.farm.create({ data });
    // Nota: Produtor deve pertencer ao mesmo grupo econômico, garantido pelo isolamento
    const producer = await this.prisma.producer.findUnique({ where: { id: farm.producerId } });
    await this.audit.log({
      userId,
      action: 'CREATE',
      model: 'Farm',
      recordId: farm.id,
      newData: farm,
      economicGroupId: producer?.economicGroupId || '',
    });
    return farm;
  }

  async findAllFarms(): Promise<Farm[]> {
    return this.prisma.extended.farm.findMany({
      include: { producer: true },
    });
  }

  // SAFRAS
  async createSafra(data: Prisma.SafraCreateInput, userId: string): Promise<Safra> {
     const safra = await this.prisma.extended.safra.create({ data });
     const farm = await this.prisma.farm.findUnique({ where: { id: safra.farmId }, include: { producer: true } });
    await this.audit.log({
      userId,
      action: 'CREATE',
      model: 'Safra',
      recordId: safra.id,
      newData: safra,
      economicGroupId: farm?.producer?.economicGroupId || '',
    });
     return safra;
  }

  // CULTURAS
  async createCultura(data: Prisma.CulturaCreateInput, userId: string): Promise<any> {
    const cultura = await this.prisma.extended.cultura.create({ data });
    return cultura;
  }

  // PRODUCAO
  async createProduction(data: any, userId: string): Promise<any> {
    // Integração com o motor de cálculos
    const totalProduction = data.area * data.productivity;
    
    const production = await this.prisma.extended.production.create({
      data: {
        ...data,
        totalProduction,
      },
    });

    return production;
  }

  async findAllBySafra(safraId: string) {
    return this.prisma.cultura.findMany({
      where: { safraId },
      include: {
        productions: true,
        costs: { include: { items: true } },
        revenues: true,
      }
    });
  }

  // CUSTOS
  async createCost(data: any, userId: string): Promise<any> {
    const cost = await this.prisma.extended.cost.create({
      data: {
        culturaId: data.culturaId,
        type: data.type,
        items: {
          create: data.items, // Array de { description, value }
        },
      },
      include: { items: true },
    });
    return cost;
  }

  // RECEITA
  async createRevenue(data: any, userId: string): Promise<any> {
    const grossRevenue = (data.unitPrice || 0) * (data.volumeSold || 0); // Added null checks
    const revenue = await this.prisma.extended.revenue.create({
      data: {
        ...data,
        grossRevenue,
      },
    });
    return revenue;
  }

  async getCulturaRating(culturaId: string): Promise<{ score: number; rating: Rating }> {
    const data = await this.prisma.cultura.findUnique({
      where: { id: culturaId },
      include: {
        productions: true,
        costs: { include: { items: true } },
        revenues: true,
      },
    });

    if (!data) throw new Error('Cultura não encontrada');

    // Cálculos simplificados para demonstração do motor
    const totalGrossRevenue = data.revenues.reduce((acc, r) => acc + r.grossRevenue, 0);
    const totalCost = data.costs.reduce((acc, c) => acc + c.items.reduce((sum, i) => sum + i.value, 0), 0);
    const ebitda = totalGrossRevenue - totalCost;
    const ebitdaMargin = totalGrossRevenue > 0 ? (ebitda / totalGrossRevenue) * 100 : 0;

    // Métricas para o Rating
    return this.ratingEngine.calculateRating({
      liquidity: 1.2, // Mockado por enquanto (exigiria balanço patrimonial completo)
      ebitdaMarginPercentage: ebitdaMargin,
      leverage: 0.4, // Mockado
      productionConsistency: 0.8, // Mockado
    });
  }

  // ASSETS
  async createAsset(data: Prisma.AssetUncheckedCreateInput, userId: string) {
    const asset = await this.prisma.extended.asset.create({ data });
    await this.logAudit(userId, 'CREATE', 'Asset', asset.id, asset, data.farmId);
    return asset;
  }

  // LIABILITIES
  async createLiability(data: Prisma.LiabilityUncheckedCreateInput, userId: string) {
    const liability = await this.prisma.extended.liability.create({ data });
    await this.logAudit(userId, 'CREATE', 'Liability', liability.id, liability, data.farmId);
    return liability;
  }

  // CPR
  async createCPR(data: Prisma.CPRUncheckedCreateInput, userId: string) {
    const cpr = await this.prisma.extended.cPR.create({ data });
    await this.logAudit(userId, 'CREATE', 'CPR', cpr.id, cpr, data.farmId);
    return cpr;
  }

  // GUARANTEES
  async createGuarantee(data: Prisma.GuaranteeUncheckedCreateInput, userId: string) {
    const guarantee = await this.prisma.extended.guarantee.create({ data });
    await this.logAudit(userId, 'CREATE', 'Guarantee', guarantee.id, guarantee, data.farmId);
    return guarantee;
  }

  // GET ALL FOR ENTITIES
  async findAllAssets() {
    return this.prisma.extended.asset.findMany({ include: { farm: true } });
  }

  async findAllLiabilities() {
    return this.prisma.extended.liability.findMany({ include: { farm: true } });
  }

  async findAllCPRs() {
    return this.prisma.extended.cPR.findMany({ include: { farm: true } });
  }

  async findAllGuarantees() {
    return this.prisma.extended.guarantee.findMany({ include: { farm: true } });
  }

  async findAllCosts() {
    return this.prisma.extended.cost.findMany({ include: { items: true, cultura: { include: { safra: { include: { farm: true } } } } } });
  }

  private async logAudit(userId: string, action: string, model: string, recordId: string, newData: any, farmId: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: farmId },
      include: { producer: true },
    });
    
    await this.audit.log({
      userId,
      action,
      model,
      recordId,
      newData,
      economicGroupId: farm?.producer?.economicGroupId || '',
    });
  }
}
