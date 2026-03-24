import { ChangeDetectionStrategy, Component, OnDestroy, computed, signal } from '@angular/core';
import {
  buildDurationMs,
  coerceDurationPart,
  formatDigitalDuration,
  formatHumanDuration,
} from '../../shared/time-utils';

type CountdownPreset = {
  readonly label: string;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
};

@Component({
  selector: 'app-countdown-panel',
  templateUrl: './countdown-panel.component.html',
  styleUrl: './countdown-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownPanelComponent implements OnDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly startedAtMs = signal<number | null>(null);
  private readonly remainingAtStartMs = signal(buildDurationMs(0, 5, 0));
  private readonly nowMs = signal(Date.now());

  protected readonly presets: CountdownPreset[] = [
    { label: '1 min', hours: 0, minutes: 1, seconds: 0 },
    { label: '5 min', hours: 0, minutes: 5, seconds: 0 },
    { label: '15 min', hours: 0, minutes: 15, seconds: 0 },
  ];

  protected readonly hours = signal(0);
  protected readonly minutes = signal(5);
  protected readonly seconds = signal(0);
  protected readonly completed = signal(false);

  protected readonly configuredDurationMs = computed(() =>
    buildDurationMs(this.hours(), this.minutes(), this.seconds()),
  );
  protected readonly isRunning = computed(() => this.startedAtMs() !== null);
  protected readonly remainingMs = computed(() => {
    const startedAtMs = this.startedAtMs();

    if (startedAtMs === null) {
      return this.remainingAtStartMs();
    }

    return Math.max(0, this.remainingAtStartMs() - (this.nowMs() - startedAtMs));
  });
  protected readonly displayTime = computed(() => formatDigitalDuration(this.remainingMs()));
  protected readonly countdownState = computed(() => {
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
  protected readonly helperText = computed(() => {
    if (this.completed()) {
      return 'Countdown finished. Start again or reset to your saved duration.';
    }

    if (this.configuredDurationMs() === 0) {
      return 'Set hours, minutes, or seconds before starting.';
    }

    return `Configured for ${formatHumanDuration(this.configuredDurationMs())}.`;
  });

  ngOnDestroy(): void {
    this.stopTicker();
  }

  protected setHours(value: string): void {
    this.hours.set(coerceDurationPart(value, 99));
    this.syncDurationFromInputs();
  }

  protected setMinutes(value: string): void {
    this.minutes.set(coerceDurationPart(value, 59));
    this.syncDurationFromInputs();
  }

  protected setSeconds(value: string): void {
    this.seconds.set(coerceDurationPart(value, 59));
    this.syncDurationFromInputs();
  }

  protected applyPreset(preset: CountdownPreset): void {
    if (this.isRunning()) {
      return;
    }

    this.hours.set(preset.hours);
    this.minutes.set(preset.minutes);
    this.seconds.set(preset.seconds);
    this.syncDurationFromInputs();
  }

  protected start(): void {
    if (this.isRunning()) {
      return;
    }

    const initialRemaining =
      this.remainingMs() > 0 ? this.remainingMs() : this.configuredDurationMs();

    if (initialRemaining === 0) {
      return;
    }

    const timestamp = Date.now();
    this.nowMs.set(timestamp);
    this.remainingAtStartMs.set(initialRemaining);
    this.startedAtMs.set(timestamp);
    this.completed.set(false);
    this.startTicker();
  }

  protected pause(): void {
    if (!this.isRunning()) {
      return;
    }

    this.nowMs.set(Date.now());
    this.remainingAtStartMs.set(this.remainingMs());
    this.startedAtMs.set(null);
    this.stopTicker();
  }

  protected reset(): void {
    this.stopTicker();
    this.startedAtMs.set(null);
    this.completed.set(false);
    this.nowMs.set(Date.now());
    this.remainingAtStartMs.set(this.configuredDurationMs());
  }

  protected toggleRunning(): void {
    if (this.isRunning()) {
      this.pause();
      return;
    }

    this.start();
  }

  private syncDurationFromInputs(): void {
    if (this.isRunning()) {
      return;
    }

    this.completed.set(false);
    this.remainingAtStartMs.set(this.configuredDurationMs());
  }

  private startTicker(): void {
    if (this.intervalId !== null) {
      return;
    }

    this.intervalId = setInterval(() => {
      this.nowMs.set(Date.now());

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
    this.startedAtMs.set(null);
    this.completed.set(true);
    this.remainingAtStartMs.set(0);
  }
}
