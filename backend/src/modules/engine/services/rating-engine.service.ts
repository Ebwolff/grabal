import { Injectable } from '@nestjs/common';

export enum Rating {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
}

@Injectable()
export class RatingEngineService {
  /**
   * Calcula o Score de Risco (0-100) e o Rating Financeiro (A-D)
   */
  calculateRating(metrics: {
    liquidity: number;
    ebitdaMarginPercentage: number;
    leverage: number;
    productionConsistency: number; // 0-1
  }): { score: number; rating: Rating } {
    let score = 0;

    // Liquidez (Max 25 points)
    if (metrics.liquidity >= 1.5) score += 25;
    else if (metrics.liquidity >= 1.0) score += 15;
    else score += 5;

    // Margem EBITDA (Max 25 points)
    if (metrics.ebitdaMarginPercentage >= 30) score += 25;
    else if (metrics.ebitdaMarginPercentage >= 15) score += 15;
    else score += 5;

    // Alavancagem (Max 25 points)
    if (metrics.leverage <= 0.3) score += 25;
    else if (metrics.leverage <= 0.6) score += 15;
    else score += 5;

    // Consistência de Produção (Max 25 points)
    score += metrics.productionConsistency * 25;

    // Determinar Rating
    let rating = Rating.D;
    if (score >= 85) rating = Rating.A;
    else if (score >= 60) rating = Rating.B;
    else if (score >= 40) rating = Rating.C;

    return { score, rating };
  }
}
