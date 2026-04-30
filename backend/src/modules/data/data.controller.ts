import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DataService } from './data.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../auth/tenant.guard';

@Controller('data')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class DataController {
  constructor(private dataService: DataService) {}

  @Post('producers')
  async createProducer(@Body() body: any, @Request() req: any) {
    return this.dataService.createProducer(body, req.user.id);
  }

  @Get('producers')
  async findAllProducers() {
    return this.dataService.findAllProducers();
  }

  @Post('farms')
  async createFarm(@Body() body: any, @Request() req: any) {
    return this.dataService.createFarm(body, req.user.id);
  }

  @Get('farms')
  async findAllFarms() {
    return this.dataService.findAllFarms();
  }

  @Post('safras')
  async createSafra(@Body() body: any, @Request() req: any) {
    return this.dataService.createSafra(body, req.user.id);
  }

  @Post('culturas')
  async createCultura(@Body() body: any, @Request() req: any) {
    return this.dataService.createCultura(body, req.user.id);
  }

  @Post('productions')
  async createProduction(@Body() body: any, @Request() req: any) {
    return this.dataService.createProduction(body, req.user.id);
  }

  @Post('costs')
  async createCost(@Body() body: any, @Request() req: any) {
    return this.dataService.createCost(body, req.user.id);
  }

  @Post('revenues')
  async createRevenue(@Body() body: any, @Request() req: any) {
    return this.dataService.createRevenue(body, req.user.id);
  }

  @Get('full-report/:safraId')
  async getFullReport(@Request() req: any) {
     return this.dataService.findAllBySafra(req.params.safraId);
  }

  @Get('rating/:culturaId')
  async getRating(@Request() req: any) {
    return this.dataService.getCulturaRating(req.params.culturaId);
  }

  @Post('assets')
  async createAsset(@Body() body: any, @Request() req: any) {
    return this.dataService.createAsset(body, req.user.id);
  }

  @Post('liabilities')
  async createLiability(@Body() body: any, @Request() req: any) {
    return this.dataService.createLiability(body, req.user.id);
  }

  @Post('cprs')
  async createCPR(@Body() body: any, @Request() req: any) {
    return this.dataService.createCPR(body, req.user.id);
  }

  @Post('guarantees')
  async createGuarantee(@Body() body: any, @Request() req: any) {
    return this.dataService.createGuarantee(body, req.user.id);
  }

  @Get('assets')
  async findAllAssets() {
    return this.dataService.findAllAssets();
  }

  @Get('liabilities')
  async findAllLiabilities() {
    return this.dataService.findAllLiabilities();
  }

  @Get('cprs')
  async findAllCPRs() {
    return this.dataService.findAllCPRs();
  }

  @Get('guarantees')
  async findAllGuarantees() {
    return this.dataService.findAllGuarantees();
  }

  @Get('costs')
  async findAllCosts() {
    return this.dataService.findAllCosts();
  }
}
