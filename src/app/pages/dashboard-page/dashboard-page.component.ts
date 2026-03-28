import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CountdownPanelComponent } from '../../components/countdown-panel/countdown-panel.component';
import { CounterPanelComponent } from '../../components/counter-panel/counter-panel.component';
import { TimerPanelComponent } from '../../components/timer-panel/timer-panel.component';

@Component({
  selector: 'app-dashboard-page',
  imports: [CounterPanelComponent, TimerPanelComponent, CountdownPanelComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  protected readonly projectName = signal('Project Nebulous Gerenuk');
  protected readonly toolNames = signal(['Counter', 'Timer', 'Countdown']);
  protected readonly workspaceNote = signal(
    'Float any tool into a compact monitor, or open it in centered fullscreen focus while setup stays here on the page.',
  );
  protected readonly heroSummary = computed(
    () =>
      `${this.toolNames().length} focused utilities with a warm, minimal surface built for your private dashboard.`,
  );
}
