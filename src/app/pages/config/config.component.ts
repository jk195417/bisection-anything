import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [],
  template: `
    <p>
      config works!
    </p>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConfigComponent {

}
