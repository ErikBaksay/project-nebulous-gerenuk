import { TestBed } from '@angular/core/testing';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
    }).compileComponents();
  });

  it('renders the dashboard headline and tools', () => {
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();

    const textContent = fixture.nativeElement.textContent as string;

    expect(textContent).toContain('Project Nebulous Gerenuk');
    expect(textContent).toContain('Counter');
    expect(textContent).toContain('Timer');
    expect(textContent).toContain('Countdown');
  });
});
