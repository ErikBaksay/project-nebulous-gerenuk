import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { BrowserSyncedStore } from '../shared/browser-synced-store';
import { formatDigitalDuration, formatHumanDuration } from '../shared/time-utils';

type TimerSnapshot = {
  readonly runStartedAtMs: number | null;
  readonly accumulatedElapsedMs: number;
};

@Injectable({ providedIn: 'root' })
export class TimerStateService extends BrowserSyncedStore<TimerSnapshot> {
  private readonly serviceDestroyRef = inject(DestroyRef);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly runStartedAtMs = signal<number | null>(null);
  private readonly accumulatedElapsedMs = signal(0);
  private readonly nowMs = signal(this.readNow());

  readonly isRunning = computed(() => this.runStartedAtMs() !== null);
  readonly elapsedMs = computed(() => {
    const runStartedAtMs = this.runStartedAtMs();

    if (runStartedAtMs === null) {
      return this.accumulatedElapsedMs();
    }

    return this.accumulatedElapsedMs() + (this.nowMs() - runStartedAtMs);
  });
  readonly displayTime = computed(() => formatDigitalDuration(this.elapsedMs()));
  readonly timerState = computed(() => {
    if (this.isRunning()) {
      return 'Running';
    }

    return this.elapsedMs() > 0 ? 'Paused' : 'Ready';
  });
  readonly helperText = computed(() => {
    if (this.elapsedMs() === 0) {
      return 'Use it like a stopwatch for focused work or quick checks.';
    }

    return `Elapsed for ${formatHumanDuration(this.elapsedMs())}.`;
  });

  constructor() {
    super('project-nebulous-gerenuk:timer');
    this.initializeSync();
    this.syncTicker();
    this.serviceDestroyRef.onDestroy(() => this.stopTicker());
  }

  start(): void {
    if (this.isRunning()) {
      return;
    }

    const timestamp = this.readNow();
    this.nowMs.set(timestamp);
    this.runStartedAtMs.set(timestamp);
    this.syncTicker();
    this.persistSnapshot();
  }

  pause(): void {
    const runStartedAtMs = this.runStartedAtMs();

    if (runStartedAtMs === null) {
      return;
    }

    const timestamp = this.readNow();
    this.nowMs.set(timestamp);
    this.accumulatedElapsedMs.set(this.accumulatedElapsedMs() + (timestamp - runStartedAtMs));
    this.runStartedAtMs.set(null);
    this.syncTicker();
    this.persistSnapshot();
  }

  reset(): void {
    this.runStartedAtMs.set(null);
    this.accumulatedElapsedMs.set(0);
    this.nowMs.set(this.readNow());
    this.syncTicker();
    this.persistSnapshot();
  }

  toggleRunning(): void {
    if (this.isRunning()) {
      this.pause();
      return;
    }

    this.start();
  }

  protected createSnapshot(): TimerSnapshot {
    return {
      runStartedAtMs: this.runStartedAtMs(),
      accumulatedElapsedMs: this.accumulatedElapsedMs(),
    };
  }

  protected normalizeSnapshot(value: unknown): TimerSnapshot | null {
    if (!isRecord(value)) {
      return null;
    }

    const accumulatedElapsedMs = normalizeNonNegativeNumber(
      readSnapshotValue(value, 'accumulatedElapsedMs', 'elapsedBeforeStartMs'),
    );
    const runStartedAtMs = normalizeNullableTimestamp(
      readSnapshotValue(value, 'runStartedAtMs', 'startedAtMs'),
    );

    if (accumulatedElapsedMs === null || runStartedAtMs === undefined) {
      return null;
    }

    return {
      accumulatedElapsedMs,
      runStartedAtMs,
    };
  }

  protected hydrateSnapshot(snapshot: TimerSnapshot): void {
    this.runStartedAtMs.set(snapshot.runStartedAtMs);
    this.accumulatedElapsedMs.set(snapshot.accumulatedElapsedMs);
    this.nowMs.set(this.readNow());
    this.syncTicker();
  }

  private syncTicker(): void {
    if (this.isRunning()) {
      this.startTicker();
      return;
    }

    this.stopTicker();
  }

  private startTicker(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.nowMs.set(this.readNow());
    }, 100);
  }

  private stopTicker(): void {
    if (this.intervalId === null) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readSnapshotValue(
  snapshot: Record<string, unknown>,
  currentKey: string,
  legacyKey: string,
): unknown {
  return snapshot[currentKey] ?? snapshot[legacyKey];
}

function normalizeNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.trunc(value));
}

function normalizeNullableTimestamp(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }

  return normalizeNonNegativeNumber(value) ?? undefined;
}
