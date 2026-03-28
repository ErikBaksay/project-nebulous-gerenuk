import { TestBed } from '@angular/core/testing';
import { CounterPanelComponent } from './counter-panel.component';

describe('CounterPanelComponent', () => {
  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CounterPanelComponent],
    }).compileComponents();
  });

  it('increments and decrements using the provided steps', () => {
    const fixture = TestBed.createComponent(CounterPanelComponent);
    fixture.detectChanges();

    const rootElement = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(
      rootElement.querySelectorAll('.adjustment-button'),
    ) as HTMLButtonElement[];

    buttons.find((button) => button.textContent?.trim() === '+100')?.click();
    buttons.find((button) => button.textContent?.trim() === '-10')?.click();
    fixture.detectChanges();

    expect(rootElement.textContent).toContain('90');
  });
});
