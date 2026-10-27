import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-bracket-chart',
  standalone: true,
  imports: [],
  template: `
    <p>
      bracket-chart works!
    </p>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BracketChartComponent {

}
