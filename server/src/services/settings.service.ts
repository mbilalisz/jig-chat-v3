import { prisma } from '../lib/prisma';

export const getUserSettings = async (userId: string) => {
  let settings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  // Create default settings if they don't exist
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: {
        userId,
      },
    });
  }

  return settings;
};

export const updateUserSettings = async (userId: string, data: any) => {
  return prisma.userSettings.update({
    where: { userId },
    data: {
      ...data,
      updatedAt: new Date(),
    },
  });
};
