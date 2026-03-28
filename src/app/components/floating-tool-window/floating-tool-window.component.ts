import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CountdownStateService } from '../../services/countdown-state.service';
import { CounterStateService } from '../../services/counter-state.service';
import { FloatingToolWindowService } from '../../services/floating-tool-window.service';
import { TimerStateService } from '../../services/timer-state.service';
import { TOOL_WINDOW_CONFIG } from '../../shared/tool-config';
import { ToolId } from '../../shared/tool.types';

@Component({
  selector: 'app-floating-tool-window',
  templateUrl: './floating-tool-window.component.html',
  styleUrl: './floating-tool-window.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FloatingToolWindowComponent {
  private readonly floatingToolWindowService = inject(FloatingToolWindowService);
  private readonly timerStateService = inject(TimerStateService);
  private readonly countdownStateService = inject(CountdownStateService);
  private readonly counterStateService = inject(CounterStateService);

  readonly toolId = input.required<ToolId>();
  protected readonly tool = computed(() => TOOL_WINDOW_CONFIG[this.toolId()]);
  protected readonly title = computed(() => FLOATING_TOOL_TITLES[this.toolId()]);

  protected readonly timerElapsedMs = this.timerStateService.elapsedMs;
  protected readonly timerIsRunning = this.timerStateService.isRunning;
  protected readonly timerDisplayTime = this.timerStateService.displayTime;
  protected readonly timerState = this.timerStateService.timerState;
  protected readonly timerMeta = computed(() =>
    this.timerElapsedMs() === 0 ? 'Ready whenever you are.' : 'Elapsed time',
  );

  protected readonly countdownConfiguredDurationMs = this.countdownStateService.configuredDurationMs;
  protected readonly countdownCompleted = this.countdownStateService.completed;
  protected readonly countdownIsRunning = this.countdownStateService.isRunning;
  protected readonly countdownDisplayTime = this.countdownStateService.displayTime;
  protected readonly countdownState = this.countdownStateService.countdownState;
  protected readonly countdownMeta = computed(() => {
    if (this.countdownCompleted()) {
      return 'Countdown finished.';
    }

    return 'Remaining time';
  });

  protected readonly counterValue = this.counterStateService.count;
  protected readonly counterCount = this.counterStateService.formattedCount;
  protected readonly counterMeta = computed(() =>
    this.counterValue() === 0 ? 'Centered at zero.' : 'Current tally',
  );

  protected toggleTimer(): void {
    this.timerStateService.toggleRunning();
  }

  protected resetTimer(): void {
    this.timerStateService.reset();
  }

  protected toggleCountdown(): void {
    this.countdownStateService.toggleRunning();
  }

  protected resetCountdown(): void {
    this.countdownStateService.reset();
  }

  protected adjustCounter(amount: number): void {
    this.counterStateService.adjust(amount);
  }

  protected resetCounter(): void {
    this.counterStateService.reset();
  }

  protected closeWindow(): void {
    this.floatingToolWindowService.close();
  }
}

const FLOATING_TOOL_TITLES: Record<ToolId, string> = {
  timer: 'Keep the stopwatch nearby.',
  countdown: 'Hold the finish line in view.',
  counter: 'Keep the tally off to the side.',
};
