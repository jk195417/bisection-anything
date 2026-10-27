import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BracketChartComponent } from './bracket-chart.component';

describe('BracketChartComponent', () => {
  let component: BracketChartComponent;
  let fixture: ComponentFixture<BracketChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BracketChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BracketChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
