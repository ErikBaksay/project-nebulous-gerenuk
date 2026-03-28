import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  ApplicationRef,
  ComponentRef,
  EnvironmentInjector,
  Injectable,
  PLATFORM_ID,
  createComponent,
  inject,
  signal,
} from '@angular/core';
import { FloatingToolWindowComponent } from '../components/floating-tool-window/floating-tool-window.component';
import { TOOL_WINDOW_CONFIG } from '../shared/tool-config';
import { ToolId } from '../shared/tool.types';

type FloatingToolWindowResult =
  | { readonly status: 'opened' }
  | { readonly status: 'unsupported' }
  | { readonly status: 'blocked' }
  | { readonly status: 'failed' };

type DocumentPictureInPictureController = {
  readonly window?: Window | null;
  requestWindow(options?: {
    width?: number;
    height?: number;
  }): Promise<Window>;
};

type PictureInPictureCapableWindow = Window &
  typeof globalThis & {
    documentPictureInPicture?: DocumentPictureInPictureController;
  };

@Injectable({ providedIn: 'root' })
export class FloatingToolWindowService {
  private readonly applicationRef = inject(ApplicationRef);
  private readonly document = inject(DOCUMENT);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly platformId = inject(PLATFORM_ID);

  readonly activeToolId = signal<ToolId | null>(null);
  readonly supported = signal(this.detectSupport());

  private floatingWindow: Window | null = null;
  private componentRef: ComponentRef<FloatingToolWindowComponent> | null = null;
  private hostElement: HTMLElement | null = null;

  async openTool(toolId: ToolId): Promise<FloatingToolWindowResult> {
    const pictureInPictureController = this.getPictureInPictureController();

    if (pictureInPictureController === null) {
      return { status: 'unsupported' };
    }

    try {
      const requestedWindow =
        this.floatingWindow !== null && !this.floatingWindow.closed
          ? this.floatingWindow
          : await pictureInPictureController.requestWindow({
              width: TOOL_WINDOW_CONFIG[toolId].popupWidth,
              height: TOOL_WINDOW_CONFIG[toolId].popupHeight,
            });

      this.prepareFloatingWindow(requestedWindow);
      this.renderTool(toolId);
      requestedWindow.focus();
      this.activeToolId.set(toolId);

      return { status: 'opened' };
    } catch (error) {
      if (isDomExceptionNamed(error, 'NotAllowedError')) {
        return { status: 'blocked' };
      }

      if (isDomExceptionNamed(error, 'NotSupportedError')) {
        return { status: 'unsupported' };
      }

      return { status: 'failed' };
    }
  }

  close(): void {
    this.floatingWindow?.close();
    this.cleanup();
  }

  private detectSupport(): boolean {
    return this.getPictureInPictureController() !== null;
  }

  private getPictureInPictureController(): DocumentPictureInPictureController | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    const browserWindow = window as PictureInPictureCapableWindow;

    if (!window.isSecureContext || browserWindow.documentPictureInPicture === undefined) {
      return null;
    }

    return browserWindow.documentPictureInPicture;
  }

  private prepareFloatingWindow(floatingWindow: Window): void {
    if (this.floatingWindow === floatingWindow) {
      return;
    }

    this.cleanup();
    this.floatingWindow = floatingWindow;
    this.copyStyleSheets(floatingWindow.document);
    floatingWindow.document.documentElement.lang = this.document.documentElement.lang || 'en';
    floatingWindow.document.body.className = 'floating-tool-window-body';
    floatingWindow.document.body.replaceChildren();
    floatingWindow.addEventListener('pagehide', this.handleFloatingWindowClosed, { once: true });
  }

  private renderTool(toolId: ToolId): void {
    if (this.floatingWindow === null) {
      throw new Error('No floating window is available.');
    }

    this.destroyRenderedTool();

    const hostElement = this.document.createElement('div');
    hostElement.className = 'floating-tool-window-host';
    this.hostElement = hostElement;

    this.componentRef = createComponent(FloatingToolWindowComponent, {
      environmentInjector: this.environmentInjector,
      hostElement,
    });
    this.applicationRef.attachView(this.componentRef.hostView);
    this.componentRef.setInput('toolId', toolId);
    this.componentRef.changeDetectorRef.detectChanges();
    this.copyStyleSheets(this.floatingWindow.document);
    this.floatingWindow.document.body.replaceChildren(hostElement);
    this.componentRef.changeDetectorRef.detectChanges();
    this.floatingWindow.document.title = `${TOOL_WINDOW_CONFIG[toolId].label} | Project Nebulous Gerenuk`;
  }

  private copyStyleSheets(targetDocument: Document): void {
    targetDocument.head.replaceChildren();

    for (const styleSheet of Array.from(this.document.styleSheets)) {
      try {
        const cssRules = Array.from(styleSheet.cssRules, (rule) => rule.cssText).join('');
        const styleElement = targetDocument.createElement('style');
        styleElement.textContent = cssRules;
        targetDocument.head.appendChild(styleElement);
      } catch {
        if (styleSheet.href === null) {
          continue;
        }

        const linkElement = targetDocument.createElement('link');
        linkElement.rel = 'stylesheet';
        linkElement.href = styleSheet.href;
        targetDocument.head.appendChild(linkElement);
      }
    }
  }

  private readonly handleFloatingWindowClosed = (): void => {
    this.cleanup();
  };

  private cleanup(): void {
    this.destroyRenderedTool();

    if (this.floatingWindow !== null) {
      this.floatingWindow.removeEventListener('pagehide', this.handleFloatingWindowClosed);
      this.floatingWindow = null;
    }

    this.activeToolId.set(null);
  }

  private destroyRenderedTool(): void {
    if (this.componentRef !== null) {
      this.applicationRef.detachView(this.componentRef.hostView);
      this.componentRef.destroy();
      this.componentRef = null;
    }

    if (this.hostElement !== null) {
      this.hostElement.remove();
      this.hostElement = null;
    }
  }
}

function isDomExceptionNamed(error: unknown, name: string): boolean {
  return error instanceof DOMException && error.name === name;
}
