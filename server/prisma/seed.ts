import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seeding...');

  // 1. Clean the database
  await prisma.userSettings.deleteMany();
  await prisma.message.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 2. Create 4 Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Bilal',
        email: 'bilal@example.com',
        passwordHash,
        settings: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        name: 'Alice',
        email: 'alice@example.com',
        passwordHash,
        settings: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        name: 'Bob',
        email: 'bob@example.com',
        passwordHash,
        settings: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        name: 'Charlie',
        email: 'charlie@example.com',
        passwordHash,
        settings: { create: {} }
      }
    }),
  ]);

  const [bilal, alice, bob, charlie] = users;

  console.log('✅ 4 Users created');

  // 3. Create Messages between them
  await prisma.message.createMany({
    data: [
      { senderId: bilal.id, receiverId: alice.id, content: 'Hey Alice, how are you?' },
      { senderId: alice.id, receiverId: bilal.id, content: 'I am good Bilal! How about you?' },
      { senderId: bob.id, receiverId: charlie.id, content: 'Charlie, did you see the new update?' },
      { senderId: charlie.id, receiverId: bob.id, content: 'Yes! It looks amazing.' },
      { senderId: bilal.id, receiverId: bob.id, content: 'Hey Bob, want to grab coffee?' },
      { senderId: bob.id, receiverId: bilal.id, content: 'Sure, let’s go at 5!' },
      { senderId: alice.id, receiverId: charlie.id, content: 'Charlie, please send the files.' },
      { senderId: charlie.id, receiverId: alice.id, content: 'Sending them right now.' },
    ]
  });

  console.log('✅ Messages created');
  console.log('🏁 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
