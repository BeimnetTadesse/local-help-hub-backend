const prisma = require('./src/lib/prisma');

async function main() {
  const categories = [
    'General Help',
    'Maintenance',
    'Tech Support',
    'Gardening',
    'Elderly Care',
    'Pet Sitting'
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  console.log('Seed data created ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
