import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CountdownPanelComponent } from '../countdown-panel/countdown-panel.component';
import { CounterPanelComponent } from '../counter-panel/counter-panel.component';
import { TimerPanelComponent } from '../timer-panel/timer-panel.component';
import { FullscreenToolViewService } from '../../services/fullscreen-tool-view.service';
import { TOOL_WINDOW_CONFIG } from '../../shared/tool-config';

@Component({
  selector: 'app-fullscreen-tool-overlay',
  imports: [TimerPanelComponent, CountdownPanelComponent, CounterPanelComponent],
  templateUrl: './fullscreen-tool-overlay.component.html',
  styleUrl: './fullscreen-tool-overlay.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullscreenToolOverlayComponent {
  private readonly fullscreenToolViewService = inject(FullscreenToolViewService);

  protected readonly activeToolId = this.fullscreenToolViewService.activeToolId;
  protected readonly isFullscreen = this.fullscreenToolViewService.isFullscreen;
  protected readonly tool = computed(() => {
    const activeToolId = this.activeToolId();

    return activeToolId === null ? null : TOOL_WINDOW_CONFIG[activeToolId];
  });
  protected readonly modeLabel = computed(() =>
    this.isFullscreen() ? 'Fullscreen Focus' : 'Focused View',
  );

  protected close(): void {
    this.fullscreenToolViewService.close();
  }
}
