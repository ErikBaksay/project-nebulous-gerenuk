import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FullscreenToolViewService } from '../../services/fullscreen-tool-view.service';
import { FloatingToolWindowService } from '../../services/floating-tool-window.service';
import { TimerStateService } from '../../services/timer-state.service';
import { ToolPanelViewMode } from '../../shared/tool.types';

@Component({
  selector: 'app-timer-panel',
  templateUrl: './timer-panel.component.html',
  styleUrl: './timer-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimerPanelComponent {
  private readonly timerStateService = inject(TimerStateService);
  private readonly fullscreenToolViewService = inject(FullscreenToolViewService);
  private readonly floatingToolWindowService = inject(FloatingToolWindowService);

  readonly viewMode = input<ToolPanelViewMode>('dashboard');
  protected readonly floatingMessage = signal<string | null>(null);
  protected readonly isRunning = this.timerStateService.isRunning;
  protected readonly elapsedMs = this.timerStateService.elapsedMs;
  protected readonly displayTime = this.timerStateService.displayTime;
  protected readonly timerState = this.timerStateService.timerState;
  protected readonly helperText = this.timerStateService.helperText;
  protected readonly activeFloatingToolId = this.floatingToolWindowService.activeToolId;
  protected readonly floatingSupported = this.floatingToolWindowService.supported;

  protected start(): void {
    this.timerStateService.start();
  }

  protected pause(): void {
    this.timerStateService.pause();
  }

  protected reset(): void {
    this.timerStateService.reset();
  }

  protected toggleRunning(): void {
    this.timerStateService.toggleRunning();
  }

  protected openFullscreenMode(): void {
    void this.fullscreenToolViewService.openTool('timer');
  }

  protected openFloatingWindow(): void {
    void this.openFloatingWindowInternal();
  }

  private async openFloatingWindowInternal(): Promise<void> {
    const result = await this.floatingToolWindowService.openTool('timer');

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
