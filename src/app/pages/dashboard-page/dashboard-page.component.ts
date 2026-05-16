import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CountdownPanelComponent } from '../../components/countdown-panel/countdown-panel.component';
import { CounterPanelComponent } from '../../components/counter-panel/counter-panel.component';
import { TimerPanelComponent } from '../../components/timer-panel/timer-panel.component';
import { CountdownStateService } from '../../services/countdown-state.service';
import { CounterStateService } from '../../services/counter-state.service';
import { TimerStateService } from '../../services/timer-state.service';
import { TOOL_WINDOW_CONFIG } from '../../shared/tool-config';
import { TOOL_IDS, ToolId, isToolId } from '../../shared/tool.types';

const ACTIVE_TOOL_STORAGE_KEY = 'project-nebulous-gerenuk:ui:active-tool';

@Component({
  selector: 'app-dashboard-page',
  imports: [CounterPanelComponent, TimerPanelComponent, CountdownPanelComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardPageComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly timerStateService = inject(TimerStateService);
  private readonly countdownStateService = inject(CountdownStateService);
  private readonly counterStateService = inject(CounterStateService);

  protected readonly projectName = signal('Project Nebulous Gerenuk');
  protected readonly workspaceNote = signal(
    'An atelier for timing rituals and precise tallies. Choose a tool and keep the stage clear.',
  );

  protected readonly tools = TOOL_IDS.map((toolId) => TOOL_WINDOW_CONFIG[toolId]);
  protected readonly activeToolId = signal<ToolId>(this.loadStoredActiveTool());
  protected readonly activeToolLabel = computed(
    () => TOOL_WINDOW_CONFIG[this.activeToolId()].label,
  );

  protected readonly timerState = this.timerStateService.timerState;
  protected readonly timerDisplayTime = this.timerStateService.displayTime;

  protected readonly countdownState = this.countdownStateService.countdownState;
  protected readonly countdownDisplayTime = this.countdownStateService.displayTime;

  protected readonly counterCount = this.counterStateService.formattedCount;

  protected setActiveTool(toolId: ToolId): void {
    this.activeToolId.set(toolId);
    this.persistActiveTool(toolId);
  }

  protected toolSummary(toolId: ToolId): string {
    switch (toolId) {
      case 'timer':
        return `${this.timerState()} · ${this.timerDisplayTime()}`;
      case 'countdown':
        return `${this.countdownState()} · ${this.countdownDisplayTime()}`;
      case 'counter':
        return `Current tally · ${this.counterCount()}`;
    }
  }

  protected isActive(toolId: ToolId): boolean {
    return this.activeToolId() === toolId;
  }

  private loadStoredActiveTool(): ToolId {
    if (!this.browser) {
      return 'timer';
    }

    const storedTool = localStorage.getItem(ACTIVE_TOOL_STORAGE_KEY);

    return isToolId(storedTool) ? storedTool : 'timer';
  }

  private persistActiveTool(toolId: ToolId): void {
    if (!this.browser) {
      return;
    }

    localStorage.setItem(ACTIVE_TOOL_STORAGE_KEY, toolId);
  }
}
