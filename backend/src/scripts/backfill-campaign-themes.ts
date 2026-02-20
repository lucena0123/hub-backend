import { PrismaClient } from '@prisma/client';
import { inferOptimizationTheme } from '../services/optimization-playbook';

const prisma = new PrismaClient();

async function main() {
  const campaigns = await prisma.campaign.findMany({
    where: { optimizationThemeKey: null },
    select: { id: true, name: true },
  });

  if (campaigns.length === 0) {
    console.log('✅ Nenhuma campanha para atualizar (optimization_theme_key já preenchido).');
    return;
  }

  let updated = 0;

  for (const campaign of campaigns) {
    const theme = inferOptimizationTheme(campaign.name);
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        optimizationThemeKey: theme.themeKey,
      },
    });
    updated++;
  }

  console.log(`✅ Atualizadas ${updated} campanhas com optimization_theme_key (fallback por nome).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
