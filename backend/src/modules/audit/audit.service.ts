import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId?: string;
    action: string;
    model: string;
    recordId: string;
    oldData?: any;
    newData?: any;
    economicGroupId: string;
  }) {
    return this.prisma.auditTrail.create({
      data: params,
    });
  }
}
