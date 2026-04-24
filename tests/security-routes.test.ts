import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockRequireUser = vi.fn();
const mockRequireAdmin = vi.fn();
const mockListBills = vi.fn();
const mockListAllBills = vi.fn();
const mockGetPublicSettings = vi.fn();

vi.mock('@/services/auth.service', () => ({
  requireUser: mockRequireUser,
  requireAdmin: mockRequireAdmin,
}));

vi.mock('@/services/bill.service', () => ({
  listBills: mockListBills,
  listAllBills: mockListAllBills,
}));

vi.mock('@/services/settings.service', () => ({
  getPublicSettings: mockGetPublicSettings,
}));

describe('security routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('public settings should only expose safe keys', async () => {
    mockGetPublicSettings.mockResolvedValue({
      site_name: 'Gudao',
      redeem_buy_url: 'https://shop.example.com',
      allow_register: 'true',
      maintenance_mode: 'false',
    });

    const { GET } = await import('@/app/api/public/settings/route');
    const res = await GET();
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.newapi_api_key).toBeUndefined();
    expect(body.data.newapi_base_url).toBeUndefined();
  });

  it('user bills route should be sanitized', async () => {
    mockRequireUser.mockResolvedValue({ id: 'u1' });
    mockListBills.mockResolvedValue({
      items: [
        {
          id: 'b1',
          requestId: 'r1',
          modelKey: 'smart',
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
          userCostCny: '0.12',
          status: 'success',
          createdAt: new Date(),
          settledAt: new Date(),
          newapiModelName: 'hidden',
          quota: '999',
          rawUsage: { hidden: true },
          modelRatio: '2',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const { GET } = await import('@/app/api/bills/route');
    const res = await GET(new Request('http://localhost/api/bills'));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.items[0].newapiModelName).toBeUndefined();
    expect(body.data.items[0].quota).toBeUndefined();
    expect(body.data.items[0].rawUsage).toBeUndefined();
    expect(body.data.items[0].modelRatio).toBeUndefined();
  });

  it('admin bills route should keep full fields', async () => {
    mockRequireAdmin.mockResolvedValue({ id: 'a1', role: 'admin' });
    mockListAllBills.mockResolvedValue({
      items: [
        {
          id: 'b1',
          newapiModelName: 'claude-sonnet',
          quota: '1000',
          modelRatio: '1.2',
          completionRatio: '1.4',
          groupRatio: '1',
          rawUsage: { total_tokens: 100 },
          costCny: '0.1',
          userCostCny: '0.2',
          profitCny: '0.1',
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    const { GET } = await import('@/app/api/admin/bills/route');
    const res = await GET(new Request('http://localhost/api/admin/bills'));
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.data.items[0].newapiModelName).toBeDefined();
    expect(body.data.items[0].quota).toBeDefined();
    expect(body.data.items[0].rawUsage).toBeDefined();
    expect(body.data.items[0].costCny).toBeDefined();
    expect(body.data.items[0].userCostCny).toBeDefined();
    expect(body.data.items[0].profitCny).toBeDefined();
  });
});
