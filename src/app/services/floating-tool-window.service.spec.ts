import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { FloatingToolWindowService } from './floating-tool-window.service';

describe('FloatingToolWindowService', () => {
  let originalPictureInPicture: unknown;
  let originalSecureContextDescriptor: PropertyDescriptor | undefined;
  let originalUserAgentDataDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    originalPictureInPicture = (
      window as Window & { documentPictureInPicture?: unknown }
    ).documentPictureInPicture;
    originalSecureContextDescriptor = Object.getOwnPropertyDescriptor(window, 'isSecureContext');
    originalUserAgentDataDescriptor = Object.getOwnPropertyDescriptor(navigator, 'userAgentData');

    Object.defineProperty(window, 'isSecureContext', {
      configurable: true,
      value: true,
    });

    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      value: {
        mobile: false,
      },
    });

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: originalPictureInPicture,
    });

    if (originalSecureContextDescriptor !== undefined) {
      Object.defineProperty(window, 'isSecureContext', originalSecureContextDescriptor);
    }

    if (originalUserAgentDataDescriptor !== undefined) {
      Object.defineProperty(navigator, 'userAgentData', originalUserAgentDataDescriptor);
    } else {
      Reflect.deleteProperty(navigator, 'userAgentData');
    }
  });

  it('opens the timer tool in a floating picture-in-picture window', async () => {
    const focus = vi.fn();
    const floatingDocument = document.implementation.createHTMLDocument('floating');
    const floatingWindow = {
      document: floatingDocument,
      focus,
      closed: false,
      close: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window;
    const requestWindow = vi.fn().mockResolvedValue(floatingWindow);

    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: {
        requestWindow,
      },
    });

    const service = TestBed.inject(FloatingToolWindowService);

    const result = await service.openTool('timer');

    expect(result.status).toBe('opened');
    expect(requestWindow).toHaveBeenCalledWith({
      width: 430,
      height: 400,
    });
    expect(service.activeToolId()).toBe('timer');
    expect(floatingDocument.body.textContent).toContain('Timer');
    expect(floatingDocument.body.textContent).toContain('Start');
    expect(focus).toHaveBeenCalledOnce();
  });

  it('treats mobile browsers as unsupported for floating monitors', () => {
    Object.defineProperty(window, 'documentPictureInPicture', {
      configurable: true,
      value: {
        requestWindow: vi.fn(),
      },
    });

    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      value: {
        mobile: true,
      },
    });

    const service = TestBed.inject(FloatingToolWindowService);

    expect(service.supported()).toBe(false);
  });
});
