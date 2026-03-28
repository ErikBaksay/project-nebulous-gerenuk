import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CounterStateService } from '../../services/counter-state.service';
import { FloatingToolWindowService } from '../../services/floating-tool-window.service';

@Component({
  selector: 'app-counter-panel',
  templateUrl: './counter-panel.component.html',
  styleUrl: './counter-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterPanelComponent {
  private readonly counterState = inject(CounterStateService);
  private readonly floatingToolWindowService = inject(FloatingToolWindowService);

  protected readonly floatingMessage = signal<string | null>(null);
  protected readonly adjustmentSteps = this.counterState.adjustmentSteps;
  protected readonly count = this.counterState.count;
  protected readonly formattedCount = this.counterState.formattedCount;
  protected readonly countSummary = this.counterState.countSummary;
  protected readonly activeFloatingToolId = this.floatingToolWindowService.activeToolId;

  protected adjust(amount: number): void {
    this.counterState.adjust(amount);
  }

  protected ariaLabelForStep(step: number): string {
    return step > 0 ? `Increase by ${step}` : `Decrease by ${Math.abs(step)}`;
  }

  protected reset(): void {
    this.counterState.reset();
  }

  protected openFloatingWindow(): void {
    void this.openFloatingWindowInternal();
  }

  private async openFloatingWindowInternal(): Promise<void> {
    const result = await this.floatingToolWindowService.openTool('counter');

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
