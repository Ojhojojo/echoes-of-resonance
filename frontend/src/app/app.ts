import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { PlayerStore } from './core/services/player-store.service';

function routeHasImmersiveLayout(router: Router): boolean {
  let route = router.routerState.root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.snapshot.data['layout'] === 'immersive';
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('Echoes of Resonance');
  readonly store = inject(PlayerStore);
  private readonly router = inject(Router);

  readonly immersiveLayout = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => routeHasImmersiveLayout(this.router)),
      startWith(routeHasImmersiveLayout(this.router)),
    ),
    { initialValue: false },
  );
}
