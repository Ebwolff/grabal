import { PrismaClient, CostType, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create Economic Group
  const eg = await prisma.economicGroup.create({
    data: {
      name: 'Grupo Bom Sucesso',
      description: 'Seed data for GramBal',
    },
  });

  // 2. Create User
  await prisma.user.create({
    data: {
      email: 'admin@grambal.com',
      password: 'hashed_password_placeholder', // Should be hashed in real scenario
      name: 'Admin User',
      role: Role.ADMIN,
      economicGroupId: eg.id,
    },
  });

  // 3. Create Producer
  const producer = await prisma.producer.create({
    data: {
      name: 'João Produtor',
      cpfCnpj: '12345678900',
      economicGroupId: eg.id,
    },
  });

  // 4. Create Farms
  const farmsData = ['Fazenda São João', 'Fazenda Rio Doce', 'Fazenda Boa Vista'];
  const farms: Record<string, any> = {};
  for (const fName of farmsData) {
    farms[fName] = await prisma.farm.create({
      data: {
        name: fName,
        producerId: producer.id,
        totalArea: 1000,
        agriculturalArea: 800,
      },
    });
  }

  // 5. Create Safras & Culturas (we need them to attach costs/revenues)
  const safrasData = ['2023/24', '2024/25'];
  const culturasData = ['Soja', 'Milho', 'Algodão', 'Café', 'Trigo'];

  // Map to easily find Cultura IDs: farm -> safra -> cultura -> id
  const culturaIds: Record<string, string> = {}; 

  for (const fName of farmsData) {
    const farm = farms[fName];
    for (const safraYear of safrasData) {
      const safra = await prisma.safra.create({
        data: {
          year: safraYear,
          farmId: farm.id,
        },
      });

      for (const cName of culturasData) {
        const cultura = await prisma.cultura.create({
          data: {
            name: cName,
            safraId: safra.id,
            plantedArea: 100,
            productivity: 60,
            sellingPrice: 120,
          },
        });
        const key = `${fName}-${safraYear}-${cName}`;
        culturaIds[key] = cultura.id;
      }
    }
  }

  const getCulturaId = (fazenda: string, safra: string, cultura: string) => {
    return culturaIds[`${fazenda}-${safra}-${cultura}`] || Object.values(culturaIds)[0];
  };

  // 6. Seed Services (Costs -> SERVICOS)
  const servicesData = [
    { cultura: 'Soja', descricao: 'Plantio direto mecanizado', custo: 180000, safra: '2024/25', fazenda: 'Fazenda São João' },
    { cultura: 'Soja', descricao: 'Aplicação herbicida pré-emergência', custo: 45000, safra: '2024/25', fazenda: 'Fazenda São João' },
    { cultura: 'Soja', descricao: 'Colheita mecanizada com transbordo', custo: 210000, safra: '2023/24', fazenda: 'Fazenda São João' },
    { cultura: 'Algodão', descricao: 'Colheita com cotton picker', custo: 480000, safra: '2023/24', fazenda: 'Fazenda Rio Doce' },
  ];

  for (const s of servicesData) {
    const culturaId = getCulturaId(s.fazenda, s.safra, s.cultura);
    const cost = await prisma.cost.create({
      data: {
        culturaId,
        type: CostType.SERVICOS,
      }
    });
    await prisma.costItem.create({
      data: {
        costId: cost.id,
        description: s.descricao,
        value: s.custo,
      }
    });
  }

  // 7. Seed Assets
  const assetsData = [
    { type: 'Terra', description: 'Área agricultável', value: 15000000, fazenda: 'Fazenda São João' },
    { type: 'Máquinas', description: 'Trator John Deere 8R', value: 2500000, fazenda: 'Fazenda São João' },
    { type: 'Instalações', description: 'Silos de Armazenagem', value: 3500000, fazenda: 'Fazenda Rio Doce' },
  ];
  for (const a of assetsData) {
    const farmId = farms[a.fazenda]?.id || farms['Fazenda São João'].id;
    await prisma.asset.create({
      data: {
        farmId,
        type: a.type,
        description: a.description,
        value: a.value,
      }
    });
  }

  // 8. Seed Liabilities
  const liabilitiesData = [
    { creditor: 'Banco do Brasil', type: 'Custeio', value: 1500000, dueDate: new Date('2024-06-30'), fazenda: 'Fazenda São João' },
    { creditor: 'John Deere Bank', type: 'Financiamento Máquina', value: 800000, dueDate: new Date('2025-12-15'), fazenda: 'Fazenda Rio Doce' },
  ];
  for (const l of liabilitiesData) {
    const farmId = farms[l.fazenda]?.id || farms['Fazenda São João'].id;
    await prisma.liability.create({
      data: {
        farmId,
        creditor: l.creditor,
        type: l.type,
        value: l.value,
        dueDate: l.dueDate,
      }
    });
  }

  // 9. Seed CPRs
  const cprsData = [
    { farmId: farms['Fazenda São João'].id, cultura: 'Soja', committedVolume: 10000, value: 1200000, dueDate: new Date('2025-05-30') },
    { farmId: farms['Fazenda Rio Doce'].id, cultura: 'Algodão', committedVolume: 5000, value: 2500000, dueDate: new Date('2025-08-15') },
  ];
  for (const c of cprsData) {
    await prisma.cPR.create({
      data: {
        farmId: c.farmId,
        cultura: c.cultura,
        committedVolume: c.committedVolume,
        value: c.value,
        dueDate: c.dueDate,
      }
    });
  }

  // 10. Seed Guarantees
  const guaranteesData = [
    { description: 'Hipoteca Fazenda São João', value: 10000000, fazenda: 'Fazenda São João' },
    { description: 'Penhor Agrícola Safra 24/25', value: 5000000, fazenda: 'Fazenda Rio Doce' },
  ];
  for (const g of guaranteesData) {
    const farmId = farms[g.fazenda]?.id || farms['Fazenda São João'].id;
    await prisma.guarantee.create({
      data: {
        farmId,
        description: g.description,
        value: g.value,
      }
    });
  }

  console.log('✅ Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
