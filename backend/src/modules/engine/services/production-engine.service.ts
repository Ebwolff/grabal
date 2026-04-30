import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductionEngineService {
  /**
   * producao_total = area * produtividade
   */
  calculateTotalProduction(area: number, productivity: number): number {
    return area * productivity;
  }

  /**
   * receita_bruta = producao_total * preco_venda
   */
  calculateGrossRevenue(totalProduction: number, sellingPrice: number): number {
    return totalProduction * sellingPrice;
  }
}
