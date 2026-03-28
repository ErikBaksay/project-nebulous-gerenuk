import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { BrowserSyncedStore } from '../shared/browser-synced-store';
import {
  buildDurationMs,
  coerceDurationPart,
  formatDigitalDuration,
  formatHumanDuration,
} from '../shared/time-utils';

export type CountdownPreset = {
  readonly label: string;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
};

type CountdownSnapshot = {
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
  readonly runStartedAtMs: number | null;
  readonly remainingWhenStartedMs: number;
  readonly completed: boolean;
};

@Injectable({ providedIn: 'root' })
export class CountdownStateService extends BrowserSyncedStore<CountdownSnapshot> {
  private readonly serviceDestroyRef = inject(DestroyRef);
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly runStartedAtMs = signal<number | null>(null);
  private readonly remainingWhenStartedMs = signal(buildDurationMs(0, 5, 0));
  private readonly nowMs = signal(this.readNow());

  readonly presets: CountdownPreset[] = [
    { label: '1 min', hours: 0, minutes: 1, seconds: 0 },
    { label: '5 min', hours: 0, minutes: 5, seconds: 0 },
    { label: '15 min', hours: 0, minutes: 15, seconds: 0 },
  ];

  readonly hours = signal(0);
  readonly minutes = signal(5);
  readonly seconds = signal(0);
  readonly completed = signal(false);

  readonly configuredDurationMs = computed(() =>
    buildDurationMs(this.hours(), this.minutes(), this.seconds()),
  );
  readonly isRunning = computed(() => this.runStartedAtMs() !== null);
  readonly remainingMs = computed(() => {
    const runStartedAtMs = this.runStartedAtMs();

    if (runStartedAtMs === null) {
      return this.remainingWhenStartedMs();
    }

    return Math.max(0, this.remainingWhenStartedMs() - (this.nowMs() - runStartedAtMs));
  });
  readonly displayTime = computed(() => formatDigitalDuration(this.remainingMs()));
  readonly countdownState = computed(() => {
    if (this.completed()) {
      return 'Complete';
    }

    if (this.isRunning()) {
      return 'Running';
    }

    if (this.remainingMs() !== this.configuredDurationMs()) {
      return 'Paused';
    }

    return this.configuredDurationMs() === 0 ? 'Add time' : 'Ready';
  });
  readonly helperText = computed(() => {
    if (this.completed()) {
      return 'Countdown finished. Start again or reset to your saved duration.';
    }

    if (this.configuredDurationMs() === 0) {
      return 'Set hours, minutes, or seconds before starting.';
    }

    if (this.isRunning()) {
      return `${formatHumanDuration(this.remainingMs())} left in the current run.`;
    }

    return `Configured for ${formatHumanDuration(this.configuredDurationMs())}.`;
  });

  constructor() {
    super('project-nebulous-gerenuk:countdown');
    this.initializeSync();
    this.refreshCompletionState();
    this.syncTicker();
    this.serviceDestroyRef.onDestroy(() => this.stopTicker());
  }

  setHours(value: string): void {
    this.hours.set(coerceDurationPart(value, 99));
    this.syncDurationFromInputs();
  }

  setMinutes(value: string): void {
    this.minutes.set(coerceDurationPart(value, 59));
    this.syncDurationFromInputs();
  }

  setSeconds(value: string): void {
    this.seconds.set(coerceDurationPart(value, 59));
    this.syncDurationFromInputs();
  }

  applyPreset(preset: CountdownPreset): void {
    if (this.isRunning()) {
      return;
    }

    this.hours.set(preset.hours);
    this.minutes.set(preset.minutes);
    this.seconds.set(preset.seconds);
    this.syncDurationFromInputs();
  }

  start(): void {
    if (this.isRunning()) {
      return;
    }

    const initialRemaining =
      this.remainingMs() > 0 ? this.remainingMs() : this.configuredDurationMs();

    if (initialRemaining === 0) {
      return;
    }

    const timestamp = this.readNow();
    this.nowMs.set(timestamp);
    this.remainingWhenStartedMs.set(initialRemaining);
    this.runStartedAtMs.set(timestamp);
    this.completed.set(false);
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
    this.remainingWhenStartedMs.set(
      Math.max(0, this.remainingWhenStartedMs() - (timestamp - runStartedAtMs)),
    );
    this.runStartedAtMs.set(null);
    this.syncTicker();
    this.persistSnapshot();
  }

  reset(): void {
    this.runStartedAtMs.set(null);
    this.completed.set(false);
    this.nowMs.set(this.readNow());
    this.remainingWhenStartedMs.set(this.configuredDurationMs());
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

  protected createSnapshot(): CountdownSnapshot {
    return {
      hours: this.hours(),
      minutes: this.minutes(),
      seconds: this.seconds(),
      runStartedAtMs: this.runStartedAtMs(),
      remainingWhenStartedMs: this.remainingWhenStartedMs(),
      completed: this.completed(),
    };
  }

  protected normalizeSnapshot(value: unknown): CountdownSnapshot | null {
    if (!isRecord(value)) {
      return null;
    }

    const hours = normalizeRangeNumber(value['hours'], 99);
    const minutes = normalizeRangeNumber(value['minutes'], 59);
    const seconds = normalizeRangeNumber(value['seconds'], 59);
    const runStartedAtMs = normalizeNullableTimestamp(
      readSnapshotValue(value, 'runStartedAtMs', 'startedAtMs'),
    );
    const remainingWhenStartedMs = normalizeNonNegativeNumber(
      readSnapshotValue(value, 'remainingWhenStartedMs', 'remainingAtStartMs'),
    );
    const completed = typeof value['completed'] === 'boolean' ? value['completed'] : null;

    if (
      hours === null ||
      minutes === null ||
      seconds === null ||
      runStartedAtMs === undefined ||
      remainingWhenStartedMs === null ||
      completed === null
    ) {
      return null;
    }

    return {
      hours,
      minutes,
      seconds,
      runStartedAtMs,
      remainingWhenStartedMs,
      completed,
    };
  }

  protected hydrateSnapshot(snapshot: CountdownSnapshot): void {
    this.hours.set(snapshot.hours);
    this.minutes.set(snapshot.minutes);
    this.seconds.set(snapshot.seconds);
    this.runStartedAtMs.set(snapshot.runStartedAtMs);
    this.remainingWhenStartedMs.set(snapshot.remainingWhenStartedMs);
    this.completed.set(snapshot.completed);
    this.nowMs.set(this.readNow());
    this.refreshCompletionState();
    this.syncTicker();
  }

  private syncDurationFromInputs(): void {
    if (this.isRunning()) {
      return;
    }

    this.completed.set(false);
    this.remainingWhenStartedMs.set(this.configuredDurationMs());
    this.persistSnapshot();
  }

  private refreshCompletionState(): void {
    if (this.runStartedAtMs() === null) {
      return;
    }

    this.nowMs.set(this.readNow());

    if (this.remainingMs() === 0) {
      this.finish();
    }
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

      if (this.remainingMs() === 0) {
        this.finish();
      }
    }, 100);
  }

  private stopTicker(): void {
    if (this.intervalId === null) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private finish(): void {
    this.stopTicker();
    this.runStartedAtMs.set(null);
    this.completed.set(true);
    this.nowMs.set(this.readNow());
    this.remainingWhenStartedMs.set(0);
    this.persistSnapshot();
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

function normalizeRangeNumber(value: unknown, max: number): number | null {
  const normalized = normalizeNonNegativeNumber(value);

  if (normalized === null) {
    return null;
  }

  return Math.min(normalized, max);
}

function normalizeNullableTimestamp(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }

  return normalizeNonNegativeNumber(value) ?? undefined;
}
