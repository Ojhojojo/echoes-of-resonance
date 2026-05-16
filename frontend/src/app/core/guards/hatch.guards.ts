import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { EchoSaveService } from '../services/echo-save.service';
import { PlayerStore } from '../services/player-store.service';

/** Ranch requires a hatched partner. */
export const requireHatchedGuard: CanActivateFn = async () => {
  const save = inject(EchoSaveService);
  const store = inject(PlayerStore);
  const router = inject(Router);

  await save.hydrate();
  if (!store.hasHatched()) {
    return router.createUrlTree(['/egg']);
  }
  return true;
};

/** Egg onboarding only before the first hatch. */
export const requireUnhatchedGuard: CanActivateFn = async () => {
  const save = inject(EchoSaveService);
  const store = inject(PlayerStore);
  const router = inject(Router);

  await save.hydrate();
  if (store.hasHatched()) {
    return router.createUrlTree(['/ranch']);
  }
  return true;
};
