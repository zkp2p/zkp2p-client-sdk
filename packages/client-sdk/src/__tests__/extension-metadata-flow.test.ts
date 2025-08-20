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
});

