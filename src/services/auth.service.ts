import { UserRole, UserStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { clearAuthCookie, getCurrentUser as getCurrentUserFromLib, hashPassword, requireAdmin as requireAdminFromLib, requireUser as requireUserFromLib, setAuthCookie, signAuthToken, verifyPassword } from '@/lib/auth';
import { getSetting } from './settings.service';

function sanitizeUser<T extends { passwordHash: string }>(user: T) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...safe } = user;
  return safe;
}

export async function register(input: { email?: string; phone?: string; password: string; nickname?: string }) {
  const allowRegister = await getSetting('allow_register');
  if (allowRegister === 'false') {
    throw new Error('REGISTER_DISABLED');
  }
  if (!input.email && !input.phone) {
    throw new Error('EMAIL_OR_PHONE_REQUIRED');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      phone: input.phone,
      passwordHash,
      nickname: input.nickname,
      role: UserRole.user,
      status: UserStatus.active,
    },
  });

  const token = signAuthToken({ userId: user.id, role: user.role });
  await setAuthCookie(token);
  return sanitizeUser(user);
}

export async function login(input: { account: string; password: string }) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: input.account }, { phone: input.account }],
    },
  });
  if (!user) throw new Error('INVALID_CREDENTIALS');
  if (user.status !== 'active') throw new Error('USER_DISABLED');

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  const token = signAuthToken({ userId: user.id, role: user.role });
  await setAuthCookie(token);
  return sanitizeUser(user);
}

export async function logout() {
  await clearAuthCookie();
  return true;
}

export async function getCurrentUser() {
  const user = await getCurrentUserFromLib();
  return user ? sanitizeUser(user) : null;
}

export const requireUser = requireUserFromLib;
export const requireAdmin = requireAdminFromLib;
