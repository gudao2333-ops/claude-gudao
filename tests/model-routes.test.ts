import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireAdmin = vi.fn();
const mockGetVisibleModelsForUser = vi.fn();
const mockGetAdminModels = vi.fn();

vi.mock('@/services/auth.service', () => ({ requireAdmin: mockRequireAdmin }));
vi.mock('@/services/model.service', () => ({
  getVisibleModelsForUser: mockGetVisibleModelsForUser,
  getAdminModels: mockGetAdminModels,
  createModel: vi.fn(),
}));

describe('model routes visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('user models should not expose real fields', async () => {
    mockGetVisibleModelsForUser.mockResolvedValue([{ id: 'm1', name: 'A', modelKey: 'a', description: '', maxOutputTokens: 100, newapiModelName: 'secret', quotaType: 1, modelRatio: '2' }]);
    const { GET } = await import('@/app/api/models/route');
    const res = await GET();
    const body = await res.json();
    expect(body.data[0].newapiModelName).toBeUndefined();
    expect(body.data[0].quotaType).toBeUndefined();
  });

  it('admin models should include full fields', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'a1' });
    mockGetAdminModels.mockResolvedValue([{ id: 'm1', newapiModelName: 'secret', modelRatio: '2' }]);
    const { GET } = await import('@/app/api/admin/models/route');
    const res = await GET();
    const body = await res.json();
    expect(body.data[0].newapiModelName).toBe('secret');
  });
});
