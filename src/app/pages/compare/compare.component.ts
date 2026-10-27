import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [],
  template: `
    <p>
      compare works!
    </p>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CompareComponent {

}
