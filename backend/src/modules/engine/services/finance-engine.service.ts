import { Injectable } from '@nestjs/common';

@Injectable()
export class FinanceEngineService {
  /**
   * margem_bruta = receita_bruta - cmv
   */
  calculateGrossMargin(grossRevenue: number, cmv: number): number {
    return grossRevenue - cmv;
  }

  /**
   * ebitda = receita_bruta - custos_operacionais
   */
  calculateEbitda(grossRevenue: number, operationalCosts: number): number {
    return grossRevenue - operationalCosts;
  }

  /**
   * lucro_liquido = receita_bruta - custos_totais
   */
  calculateNetProfit(grossRevenue: number, totalCosts: number): number {
    return grossRevenue - totalCosts;
  }

  /**
   * liquidez = ativos_totais / passivos_totais
   */
  calculateLiquidity(totalAssets: number, totalLiabilities: number): number {
    if (totalLiabilities === 0) return 0;
    return totalAssets / totalLiabilities;
  }

  /**
   * alavancagem = passivos_totais / ativos_totais
   */
  calculateLeverage(totalLiabilities: number, totalAssets: number): number {
    if (totalAssets === 0) return 0;
    return totalLiabilities / totalAssets;
  }
}
