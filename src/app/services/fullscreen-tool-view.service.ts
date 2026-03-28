import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { ToolId } from '../shared/tool.types';

type FullscreenToolViewResult =
  | { readonly status: 'fullscreen' }
  | { readonly status: 'focused' };

@Injectable({ providedIn: 'root' })
export class FullscreenToolViewService {
  private static readonly focusModeClassName = 'app-focus-mode';
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly activeToolId = signal<ToolId | null>(null);
  readonly isFullscreen = signal(false);

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.document.addEventListener('fullscreenchange', this.handleFullscreenChange);
    this.destroyRef.onDestroy(() => {
      this.toggleScrollLock(false);
      this.document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    });
  }

  async openTool(toolId: ToolId): Promise<FullscreenToolViewResult> {
    this.activeToolId.set(toolId);
    this.toggleScrollLock(true);

    if (!this.supportsFullscreen()) {
      this.isFullscreen.set(false);
      return { status: 'focused' };
    }

    try {
      if (this.document.fullscreenElement !== this.document.documentElement) {
        await this.document.documentElement.requestFullscreen();
      }

      this.syncFullscreenState();

      return this.isFullscreen() ? { status: 'fullscreen' } : { status: 'focused' };
    } catch {
      this.syncFullscreenState();
      return { status: 'focused' };
    }
  }

  close(): void {
    void this.closeInternal();
  }

  private async closeInternal(): Promise<void> {
    if (this.supportsFullscreen() && this.document.fullscreenElement !== null) {
      try {
        await this.document.exitFullscreen();
      } catch {
        // Fall back to closing the focused overlay even if the browser rejects the exit request.
      }
    }

    this.isFullscreen.set(false);
    this.activeToolId.set(null);
    this.toggleScrollLock(false);
  }

  private supportsFullscreen(): boolean {
    return (
      isPlatformBrowser(this.platformId) &&
      typeof this.document.documentElement.requestFullscreen === 'function'
    );
  }

  private syncFullscreenState(): void {
    this.isFullscreen.set(this.document.fullscreenElement !== null);
  }

  private toggleScrollLock(locked: boolean): void {
    this.document.documentElement.classList.toggle(
      FullscreenToolViewService.focusModeClassName,
      locked,
    );
    this.document.body.classList.toggle(FullscreenToolViewService.focusModeClassName, locked);
  }

  private readonly handleFullscreenChange = (): void => {
    this.syncFullscreenState();

    if (this.document.fullscreenElement === null) {
      this.activeToolId.set(null);
      this.toggleScrollLock(false);
      return;
    }

    this.toggleScrollLock(true);
  };
}
