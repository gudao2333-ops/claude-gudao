import { prisma } from '@/lib/prisma';

export async function listAnnouncements() {
  return prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
}

export async function createAnnouncement(data: Parameters<typeof prisma.announcement.create>[0]['data']) {
  return prisma.announcement.create({ data });
}

export async function updateAnnouncement(id: string, data: Parameters<typeof prisma.announcement.update>[0]['data']) {
  return prisma.announcement.update({ where: { id }, data });
}

export async function deleteAnnouncement(id: string) {
  return prisma.announcement.delete({ where: { id } });
}
