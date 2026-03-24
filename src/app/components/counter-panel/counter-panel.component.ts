import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

const COUNT_FORMATTER = new Intl.NumberFormat('en-US');

@Component({
  selector: 'app-counter-panel',
  templateUrl: './counter-panel.component.html',
  styleUrl: './counter-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CounterPanelComponent {
  protected readonly adjustmentSteps = [-100, -10, -1, 1, 10, 100];
  protected readonly count = signal(0);
  protected readonly formattedCount = computed(() => COUNT_FORMATTER.format(this.count()));
  protected readonly countSummary = computed(() => {
    const value = this.count();

    if (value === 0) {
      return 'Centered and ready for the next move.';
    }

    const absoluteValue = COUNT_FORMATTER.format(Math.abs(value));

    return value > 0
      ? `${absoluteValue} above zero and climbing.`
      : `${absoluteValue} below zero and heading back.`;
  });

  protected adjust(amount: number): void {
    this.count.update((currentValue) => currentValue + amount);
  }

  protected ariaLabelForStep(step: number): string {
    return step > 0 ? `Increase by ${step}` : `Decrease by ${Math.abs(step)}`;
  }

  protected reset(): void {
    this.count.set(0);
  }
}
