import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  let user = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        password: hashedPassword,
      },
    });
  } else {
    await prisma.user.update({
      where: { email: 'test@example.com' },
      data: { password: hashedPassword },
    });
  }

  let workspace = await prisma.workspace.findFirst({ where: { ownerId: user.id } });
  if (!workspace) {
    workspace = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
        slug: 'test-workspace',
        ownerId: user.id,
      }
    });
  }

  let project = await prisma.project.findFirst({ where: { workspaceId: workspace.id } });
  if (!project) {
    project = await prisma.project.create({
      data: {
        name: 'Test Project',
        key: 'TEST',
        workspaceId: workspace.id,
      }
    });
  }

  let issue = await prisma.issue.findFirst({ where: { projectId: project.id } });
  if (!issue) {
    await prisma.issue.create({
      data: {
        title: 'Test Issue with Tooltips',
        description: 'Testing tooltips on estimate and priority',
        status: 'TODO',
        priority: 'HIGH',
        estimate: 5,
        projectId: project.id,
        issueNumber: 1,
        projectKey: 'TEST'
      }
    });
  }

  console.log('Test data ready.');
  console.log('User:', user.email, 'password123');
  console.log('Project Key:', project.key);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
