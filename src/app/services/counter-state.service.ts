import { Injectable, computed, signal } from '@angular/core';
import { BrowserSyncedStore } from '../shared/browser-synced-store';

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');

type CounterSnapshot = {
  readonly count: number;
};

@Injectable({ providedIn: 'root' })
export class CounterStateService extends BrowserSyncedStore<CounterSnapshot> {
  readonly adjustmentSteps = [-100, -10, -1, 1, 10, 100] as const;
  readonly count = signal(0);
  readonly formattedCount = computed(() => COUNT_FORMATTER.format(this.count()));
  readonly countSummary = computed(() => {
    const value = this.count();

    if (value === 0) {
      return 'Centered and ready for the next move.';
    }

    const absoluteValue = COUNT_FORMATTER.format(Math.abs(value));

    return value > 0
      ? `${absoluteValue} above zero and climbing.`
      : `${absoluteValue} below zero and heading back.`;
  });

  constructor() {
    super('project-nebulous-gerenuk:counter');
    this.initializeSync();
  }

  adjust(amount: number): void {
    this.count.update((currentValue) => currentValue + amount);
    this.persistSnapshot();
  }

  reset(): void {
    if (this.count() === 0) {
      return;
    }

    this.count.set(0);
    this.persistSnapshot();
  }

  protected createSnapshot(): CounterSnapshot {
    return {
      count: this.count(),
    };
  }

  protected normalizeSnapshot(value: unknown): CounterSnapshot | null {
    if (!isRecord(value) || !isFiniteNumber(value['count'])) {
      return null;
    }

    return {
      count: Math.trunc(value['count']),
    };
  }

  protected hydrateSnapshot(snapshot: CounterSnapshot): void {
    this.count.set(snapshot.count);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
