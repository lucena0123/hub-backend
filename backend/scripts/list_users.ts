
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('\n=== REGISTERED USERS ===');
    const users = await prisma.user.findMany();
    if (users.length === 0) {
        console.log('No system users found.');
    } else {
        users.forEach(u => console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`));
    }

    console.log('\n=== ACTIVE CLIENTS ===');
    const clients = await prisma.client.findMany();
    if (clients.length === 0) {
        console.log('No clients found.');
    } else {
        clients.forEach(c => console.log(`- ${c.name} (${c.email}) [Status: ${c.status}] [Tier: ${c.tier}]`));
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
