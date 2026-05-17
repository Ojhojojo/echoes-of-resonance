import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-ranch-hud-dock',
  standalone: true,
  templateUrl: './ranch-hud-dock.component.html',
  styleUrl: './ranch-hud-dock.component.css',
})
export class RanchHudDockComponent {
  readonly planSheetOpen = input(false);

  readonly echoDance = output<void>();
  readonly harmonyGarden = output<void>();
  readonly openPlan = output<void>();
  readonly openEvolution = output<void>();
}
