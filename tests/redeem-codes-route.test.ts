import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockRequireAdmin = vi.fn();
const mockListRedeemCodes = vi.fn();

vi.mock('@/services/auth.service', () => ({ requireAdmin: mockRequireAdmin }));
const mockExportRedeemCodes = vi.fn();
vi.mock('@/services/redeem-code.service', () => ({ listRedeemCodes: mockListRedeemCodes, createRedeemCode: vi.fn(), exportRedeemCodes: mockExportRedeemCodes }));

describe('admin redeem code route query parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireAdmin.mockResolvedValue({ id: 'a1', role: 'admin' });
    mockListRedeemCodes.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20, stats: {} });
    mockExportRedeemCodes.mockResolvedValue('code,amount\\nX,1');
  });

  it('status empty should not 400', async () => {
    const { GET } = await import('@/app/api/admin/redeem-codes/route');
    const res = await GET(new Request('http://localhost/api/admin/redeem-codes?status='));
    expect(res.status).toBe(200);
  });

  it('status unused should work', async () => {
    const { GET } = await import('@/app/api/admin/redeem-codes/route');
    const res = await GET(new Request('http://localhost/api/admin/redeem-codes?status=unused'));
    expect(res.status).toBe(200);
  });

  it('status invalid should 400', async () => {
    const { GET } = await import('@/app/api/admin/redeem-codes/route');
    const res = await GET(new Request('http://localhost/api/admin/redeem-codes?status=invalid'));
    expect(res.status).toBe(400);
  });

  it('export should support filtered query', async () => {
    const { GET } = await import('@/app/api/admin/redeem-codes/export/route');
    const res = await GET(new Request('http://localhost/api/admin/redeem-codes/export?status=unused&batchNo=2026A'));
    expect(res.status).toBe(200);
    expect(mockExportRedeemCodes).toHaveBeenCalled();
  });
});
