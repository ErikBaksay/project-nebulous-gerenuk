import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import { formatDigitalDuration, formatHumanDuration } from '../../shared/time-utils';

@Component({
  selector: 'app-timer-panel',
  templateUrl: './timer-panel.component.html',
  styleUrl: './timer-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerPanelComponent implements OnDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly startedAtMs = signal<number | null>(null);
  private readonly elapsedBeforeStartMs = signal(0);
  private readonly nowMs = signal(Date.now());

  protected readonly isRunning = computed(() => this.startedAtMs() !== null);
  protected readonly elapsedMs = computed(() => {
    const startedAtMs = this.startedAtMs();

    if (startedAtMs === null) {
      return this.elapsedBeforeStartMs();
    }

    return this.elapsedBeforeStartMs() + (this.nowMs() - startedAtMs);
  });
  protected readonly displayTime = computed(() => formatDigitalDuration(this.elapsedMs()));
  protected readonly timerState = computed(() => {
    if (this.isRunning()) {
      return 'Running';
    }

    return this.elapsedMs() > 0 ? 'Paused' : 'Ready';
  });
  protected readonly helperText = computed(() => {
    if (this.elapsedMs() === 0) {
      return 'Use it like a stopwatch for focused work or quick checks.';
    }

    return `Elapsed for ${formatHumanDuration(this.elapsedMs())}.`;
  });

  ngOnDestroy(): void {
    this.stopTicker();
  }

  protected start(): void {
    if (this.isRunning()) {
      return;
    }

    const timestamp = Date.now();
    this.nowMs.set(timestamp);
    this.startedAtMs.set(timestamp);
    this.startTicker();
  }

  protected pause(): void {
    if (!this.isRunning()) {
      return;
    }

    this.nowMs.set(Date.now());
    this.elapsedBeforeStartMs.set(this.elapsedMs());
    this.startedAtMs.set(null);
    this.stopTicker();
  }

  protected reset(): void {
    this.pause();
    this.elapsedBeforeStartMs.set(0);
    this.nowMs.set(Date.now());
  }

  protected toggleRunning(): void {
    if (this.isRunning()) {
      this.pause();
      return;
    }

    this.start();
  }

  private startTicker(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.nowMs.set(Date.now());
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
