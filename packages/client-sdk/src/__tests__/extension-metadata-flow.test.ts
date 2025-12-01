import { describe, it, expect } from 'vitest';
import { ExtensionMetadataFlow, metadataUtils } from '../extension/metadataFlow';

describe('ExtensionMetadataFlow', () => {
  it('ingests and surfaces metadata with expiry checks', () => {
    const flow = new ExtensionMetadataFlow({ versionPollMs: 0 });
    const updates: any[] = [];
    const unsub = flow.subscribe((platform, record) => updates.push({ platform, record }));

    flow.ingest('wise' as any, [
      { originalIndex: 2, hidden: false, amount: '10', date: '2024-01-01T00:00:00Z' } as any,
      { originalIndex: 3, hidden: true, amount: '20', date: '2024-01-02T00:00:00Z' } as any,
    ], Date.now() + 60_000);

    const rec = flow.get('wise' as any)!;
    expect(rec).toBeTruthy();
    expect(flow.isExpired('wise' as any)).toBe(false);
    expect(updates.length).toBe(1);

    const visible = metadataUtils.filterVisible(rec.metadata);
    expect(visible.length).toBe(1);
    expect(visible[0].originalIndex).toBe(2);

    const sorted = metadataUtils.sortByDateDesc(rec.metadata);
    expect(sorted[0].date).toBe('2024-01-02T00:00:00Z');

    const selected = metadataUtils.selectByOriginalIndex(rec.metadata, 3);
    expect(selected?.originalIndex).toBe(3);

    unsub();
    flow.dispose();
  });

  it('sorts dates when metadata.date is number or string', () => {
    const flow = new ExtensionMetadataFlow({ versionPollMs: 0 });
    flow.ingest('revolut' as any, [
      { originalIndex: 1, hidden: false, amount: '10', date: 1706000000000 } as any, // number ms epoch (highest)
      { originalIndex: 2, hidden: false, amount: '20', date: '2024-01-02T00:00:00Z' } as any, // ISO string
      { originalIndex: 3, hidden: false, amount: '30', date: '1690000000' } as any, // numeric string
      { originalIndex: 4, hidden: false, amount: '40' } as any, // missing date
    ], Date.now() + 60_000);

    const rec = flow.get('revolut' as any)!;
    const sorted = metadataUtils.sortByDateDesc(rec.metadata);
    expect(sorted[0].originalIndex).toBe(1); // highest epoch
    expect(sorted[sorted.length - 1].originalIndex).toBe(4); // missing date lowest

    flow.dispose();
  });
});
