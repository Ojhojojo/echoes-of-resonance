import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Simple landing route — heavy play happens on `/ranch`. */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="home">
      <h1 class="home__title">Echoes of Resonance</h1>
      <p class="home__lead">Raise your Echo on the sky ranch — peaceful, cute, touch-friendly.</p>
      <a routerLink="/ranch" class="home__cta">Enter the Ranch</a>
    </section>
  `,
  styles: `
    .home {
      max-width: 36rem;
      margin: 0 auto;
      padding: 1.5rem 1rem 2rem;
      padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
      text-align: center;
    }
    .home__title {
      font-size: clamp(1.5rem, 5vw, 2rem);
      margin: 0 0 0.75rem;
      color: var(--eor-text);
    }
    .home__lead {
      margin: 0 0 1.5rem;
      color: var(--eor-muted);
      line-height: 1.5;
    }
    .home__cta {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 48px;
      padding: 0.65rem 1.25rem;
      border-radius: 12px;
      background: linear-gradient(135deg, var(--eor-accent), var(--eor-accent-2));
      color: #fff;
      font-weight: 700;
      text-decoration: none;
      touch-action: manipulation;
    }
    .home__cta:focus-visible {
      outline: 2px solid var(--eor-focus);
      outline-offset: 3px;
    }
  `,
})
export class HomeComponent {}
