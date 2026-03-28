import { TestBed } from '@angular/core/testing';
import { FullscreenToolViewService } from './fullscreen-tool-view.service';

describe('FullscreenToolViewService', () => {
  let originalFullscreenElementDescriptor: PropertyDescriptor | undefined;
  let originalRequestFullscreen: typeof document.documentElement.requestFullscreen | undefined;
  let originalExitFullscreen: typeof document.exitFullscreen | undefined;
  let fullscreenElement: Element | null;

  beforeEach(() => {
    fullscreenElement = null;
    originalFullscreenElementDescriptor = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
    originalRequestFullscreen = document.documentElement.requestFullscreen;
    originalExitFullscreen = document.exitFullscreen;

    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      get: () => fullscreenElement,
    });

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    if (originalFullscreenElementDescriptor !== undefined) {
      Object.defineProperty(document, 'fullscreenElement', originalFullscreenElementDescriptor);
    }

    document.documentElement.requestFullscreen = originalRequestFullscreen!;
    document.exitFullscreen = originalExitFullscreen!;
  });

  it('opens a focused tool in fullscreen when the browser API is available', async () => {
    document.documentElement.requestFullscreen = async () => {
      fullscreenElement = document.documentElement;
      document.dispatchEvent(new Event('fullscreenchange'));
    };

    const service = TestBed.inject(FullscreenToolViewService);

    const result = await service.openTool('timer');

    expect(result.status).toBe('fullscreen');
    expect(service.activeToolId()).toBe('timer');
    expect(service.isFullscreen()).toBe(true);
    expect(document.body.classList.contains('app-focus-mode')).toBe(true);
  });

  it('falls back to focused mode when fullscreen is unavailable', async () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      configurable: true,
      value: undefined,
    });

    const service = TestBed.inject(FullscreenToolViewService);

    const result = await service.openTool('countdown');

    expect(result.status).toBe('focused');
    expect(service.activeToolId()).toBe('countdown');
    expect(service.isFullscreen()).toBe(false);
    expect(document.documentElement.classList.contains('app-focus-mode')).toBe(true);
  });

  it('closes the focused tool when fullscreen exits', async () => {
    document.documentElement.requestFullscreen = async () => {
      fullscreenElement = document.documentElement;
      document.dispatchEvent(new Event('fullscreenchange'));
    };
    document.exitFullscreen = async () => {
      fullscreenElement = null;
      document.dispatchEvent(new Event('fullscreenchange'));
    };

    const service = TestBed.inject(FullscreenToolViewService);

    await service.openTool('counter');
    service.close();
    await Promise.resolve();

    expect(service.activeToolId()).toBeNull();
    expect(service.isFullscreen()).toBe(false);
    expect(document.body.classList.contains('app-focus-mode')).toBe(false);
    expect(document.documentElement.classList.contains('app-focus-mode')).toBe(false);
  });
});
