import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import {
  CountdownPreset,
  CountdownStateService,
} from '../../services/countdown-state.service';
import { FullscreenToolViewService } from '../../services/fullscreen-tool-view.service';
import { FloatingToolWindowService } from '../../services/floating-tool-window.service';
import { ToolPanelViewMode } from '../../shared/tool.types';

@Component({
  selector: 'app-countdown-panel',
  templateUrl: './countdown-panel.component.html',
  styleUrl: './countdown-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownPanelComponent {
  private readonly countdownStateService = inject(CountdownStateService);
  private readonly fullscreenToolViewService = inject(FullscreenToolViewService);
  private readonly floatingToolWindowService = inject(FloatingToolWindowService);

  readonly viewMode = input<ToolPanelViewMode>('dashboard');
  protected readonly floatingMessage = signal<string | null>(null);
  protected readonly presets = this.countdownStateService.presets;
  protected readonly hours = this.countdownStateService.hours;
  protected readonly minutes = this.countdownStateService.minutes;
  protected readonly seconds = this.countdownStateService.seconds;
  protected readonly completed = this.countdownStateService.completed;
  protected readonly configuredDurationMs = this.countdownStateService.configuredDurationMs;
  protected readonly isRunning = this.countdownStateService.isRunning;
  protected readonly remainingMs = this.countdownStateService.remainingMs;
  protected readonly displayTime = this.countdownStateService.displayTime;
  protected readonly countdownState = this.countdownStateService.countdownState;
  protected readonly helperText = this.countdownStateService.helperText;
  protected readonly activeFloatingToolId = this.floatingToolWindowService.activeToolId;

  protected setHours(value: string): void {
    this.countdownStateService.setHours(value);
  }

  protected setMinutes(value: string): void {
    this.countdownStateService.setMinutes(value);
  }

  protected setSeconds(value: string): void {
    this.countdownStateService.setSeconds(value);
  }

  protected applyPreset(preset: CountdownPreset): void {
    this.countdownStateService.applyPreset(preset);
  }

  protected start(): void {
    this.countdownStateService.start();
  }

  protected pause(): void {
    this.countdownStateService.pause();
  }

  protected reset(): void {
    this.countdownStateService.reset();
  }

  protected toggleRunning(): void {
    this.countdownStateService.toggleRunning();
  }

  protected openFullscreenMode(): void {
    void this.fullscreenToolViewService.openTool('countdown');
  }

  protected openFloatingWindow(): void {
    void this.openFloatingWindowInternal();
  }

  private async openFloatingWindowInternal(): Promise<void> {
    const result = await this.floatingToolWindowService.openTool('countdown');

    this.floatingMessage.set(getFloatingMessage(result.status));
  }
}

function getFloatingMessage(status: 'opened' | 'unsupported' | 'blocked' | 'failed'): string | null {
  switch (status) {
    case 'opened':
      return null;
    case 'unsupported':
      return 'Always-on-top floating windows need a Chromium browser with Document Picture-in-Picture support.';
    case 'blocked':
      return 'The browser blocked the floating window request. Try the button again directly from the page.';
    case 'failed':
      return 'The floating window could not be opened this time.';
  }
}
