import { TestBed } from '@angular/core/testing';
import { DashboardPageComponent } from './dashboard-page.component';

const ACTIVE_TOOL_STORAGE_KEY = 'project-nebulous-gerenuk:ui:active-tool';

describe('DashboardPageComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
    }).compileComponents();
  });

  it('renders the dashboard headline and tool labels', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent as string;

    expect(textContent).toContain('Project Nebulous Gerenuk');
    expect(textContent).toContain('Timer');
    expect(textContent).toContain('Countdown');
    expect(textContent).toContain('Counter');
  });

  it('defaults to timer when no saved tool exists', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const rootElement = fixture.nativeElement as HTMLElement;

    expect(rootElement.querySelector('app-timer-panel')).not.toBeNull();
    expect(rootElement.querySelector('app-countdown-panel')).toBeNull();
    expect(rootElement.querySelector('app-counter-panel')).toBeNull();
  });

  it('falls back to timer when localStorage has an invalid tool id', () => {
    localStorage.setItem(ACTIVE_TOOL_STORAGE_KEY, 'invalid-tool');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const rootElement = fixture.nativeElement as HTMLElement;

    expect(rootElement.querySelector('app-timer-panel')).not.toBeNull();
    expect(rootElement.querySelector('app-countdown-panel')).toBeNull();
    expect(rootElement.querySelector('app-counter-panel')).toBeNull();
  });

  it('restores a valid stored tool id', () => {
    localStorage.setItem(ACTIVE_TOOL_STORAGE_KEY, 'counter');

    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const rootElement = fixture.nativeElement as HTMLElement;

    expect(rootElement.querySelector('app-timer-panel')).toBeNull();
    expect(rootElement.querySelector('app-countdown-panel')).toBeNull();
    expect(rootElement.querySelector('app-counter-panel')).not.toBeNull();
  });

  it('switches the active stage when a rail tool is selected', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const rootElement = fixture.nativeElement as HTMLElement;
    const countdownTab = rootElement.querySelector('#tool-tab-countdown') as HTMLButtonElement;

    countdownTab.click();
    fixture.detectChanges();

    expect(rootElement.querySelector('app-timer-panel')).toBeNull();
    expect(rootElement.querySelector('app-countdown-panel')).not.toBeNull();
    expect(localStorage.getItem(ACTIVE_TOOL_STORAGE_KEY)).toBe('countdown');
  });
});
