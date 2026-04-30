import { createClient } from './client'

// ─── Types ─────────────────────────────────────────────────
export interface EconomicGroup {
  id: string
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Producer {
  id: string
  name: string
  cpfCnpj: string
  email: string | null
  phone: string | null
  economicGroupId: string
  createdAt: string
  updatedAt: string
}

export interface Farm {
  id: string
  producerId: string
  name: string
  location: string | null
  totalArea: number
  agriculturalArea: number
  createdAt: string
  updatedAt: string
  producer?: Producer
  safras?: Safra[]
}

export interface Safra {
  id: string
  farmId: string
  year: string
  description: string | null
  createdAt: string
  updatedAt: string
  culturas?: Cultura[]
}

export interface Cultura {
  id: string
  safraId: string
  name: string
  plantedArea: number
  productivity: number
  sellingPrice: number
  createdAt: string
  updatedAt: string
}

export interface ProductionRecord {
  id: string
  culturaId: string
  area: number
  productivity: number
  totalProduction: number
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  farmId: string
  type: string
  description: string
  value: number
  createdAt: string
  updatedAt: string
}

export interface Liability {
  id: string
  farmId: string
  creditor: string
  type: string
  value: number
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface CPR {
  id: string
  farmId: string
  cultura: string
  committedVolume: number
  value: number
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface Guarantee {
  id: string
  farmId: string
  description: string
  value: number
  createdAt: string
  updatedAt: string
}

export interface CostRecord {
  id: string
  culturaId: string
  type: string
  createdAt: string
  updatedAt: string
  items?: CostItem[]
}

export interface CostItem {
  id: string
  costId: string
  description: string
  value: number
  createdAt: string
  updatedAt: string
}

// ─── Database Service ──────────────────────────────────────
const supabase = () => createClient()

// EconomicGroup
export async function getEconomicGroups(): Promise<EconomicGroup[]> {
  const { data, error } = await supabase().from('EconomicGroup').select('*').order('createdAt')
  if (error) throw error
  return data || []
}

// Producer
export async function getProducers(): Promise<Producer[]> {
  const { data, error } = await supabase().from('Producer').select('*').order('name')
  if (error) throw error
  return data || []
}

export async function createProducer(producer: Omit<Producer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Producer> {
  const { data, error } = await supabase().from('Producer').insert(producer).select().single()
  if (error) throw error
  return data
}

// Farm
export async function getFarms(): Promise<Farm[]> {
  const { data, error } = await supabase()
    .from('Farm')
    .select('*, Safra(*)')
    .order('createdAt', { ascending: false })
  if (error) throw error
  return data || []
}

export async function getFarmsSimple(): Promise<Farm[]> {
  const { data, error } = await supabase()
    .from('Farm')
    .select('*')
    .order('name')
  if (error) throw error
  return data || []
}

export async function createFarm(farm: Omit<Farm, 'id' | 'createdAt' | 'updatedAt' | 'producer' | 'safras'>): Promise<Farm> {
  const { data, error } = await supabase().from('Farm').insert(farm).select().single()
  if (error) throw error
  return data
}

export async function deleteFarm(id: string): Promise<void> {
  const { error } = await supabase().from('Farm').delete().eq('id', id)
  if (error) throw error
}

// Safra
export async function getSafras(farmId?: string): Promise<Safra[]> {
  let query = supabase().from('Safra').select('*, Cultura:id(*)').order('year', { ascending: false })
  if (farmId) query = query.eq('farmId', farmId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createSafra(safra: Omit<Safra, 'id' | 'createdAt' | 'updatedAt' | 'culturas'>): Promise<Safra> {
  const { data, error } = await supabase().from('Safra').insert(safra).select().single()
  if (error) throw error
  return data
}

// Cultura
export async function getCulturas(safraId?: string): Promise<Cultura[]> {
  let query = supabase().from('Cultura').select('*').order('name')
  if (safraId) query = query.eq('safraId', safraId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createCultura(cultura: Omit<Cultura, 'id' | 'createdAt' | 'updatedAt'>): Promise<Cultura> {
  const { data, error } = await supabase().from('Cultura').insert(cultura).select().single()
  if (error) throw error
  return data
}

// Asset
export async function getAssets(farmId?: string): Promise<Asset[]> {
  let query = supabase().from('Asset').select('*').order('createdAt', { ascending: false })
  if (farmId) query = query.eq('farmId', farmId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
  const { data, error } = await supabase().from('Asset').insert(asset).select().single()
  if (error) throw error
  return data
}

// Liability
export async function getLiabilities(farmId?: string): Promise<Liability[]> {
  let query = supabase().from('Liability').select('*').order('dueDate')
  if (farmId) query = query.eq('farmId', farmId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createLiability(liability: Omit<Liability, 'id' | 'createdAt' | 'updatedAt'>): Promise<Liability> {
  const { data, error } = await supabase().from('Liability').insert(liability).select().single()
  if (error) throw error
  return data
}

// CPR
export async function getCPRs(farmId?: string): Promise<CPR[]> {
  let query = supabase().from('CPR').select('*').order('dueDate')
  if (farmId) query = query.eq('farmId', farmId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createCPR(cpr: Omit<CPR, 'id' | 'createdAt' | 'updatedAt'>): Promise<CPR> {
  const { data, error } = await supabase().from('CPR').insert(cpr).select().single()
  if (error) throw error
  return data
}

// Guarantee
export async function getGuarantees(farmId?: string): Promise<Guarantee[]> {
  let query = supabase().from('Guarantee').select('*').order('createdAt', { ascending: false })
  if (farmId) query = query.eq('farmId', farmId)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function createGuarantee(guarantee: Omit<Guarantee, 'id' | 'createdAt' | 'updatedAt'>): Promise<Guarantee> {
  const { data, error } = await supabase().from('Guarantee').insert(guarantee).select().single()
  if (error) throw error
  return data
}

// Production
export async function createProduction(production: Omit<ProductionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProductionRecord> {
  const { data, error } = await supabase().from('Production').insert(production).select().single()
  if (error) throw error
  return data
}

// Cost + CostItem
export async function createCostWithItems(
  cost: Omit<CostRecord, 'id' | 'createdAt' | 'updatedAt' | 'items'>,
  items: Omit<CostItem, 'id' | 'costId' | 'createdAt' | 'updatedAt'>[]
): Promise<CostRecord> {
  const { data: costData, error: costError } = await supabase().from('Cost').insert(cost).select().single()
  if (costError) throw costError

  if (items.length > 0) {
    const itemsWithCostId = items.map(item => ({ ...item, costId: costData.id }))
    const { error: itemsError } = await supabase().from('CostItem').insert(itemsWithCostId)
    if (itemsError) throw itemsError
  }

  return costData
}
