import { Injectable } from '@angular/core';
import { ECHO_CATALOG, getEchoDefinition, type EchoDefinition } from '../data/echo-catalog';

/**
 * Read-only access to `assets/data/echo-definitions.json` (bundled at build time).
 */
@Injectable({ providedIn: 'root' })
export class EchoCatalogService {
  readonly catalog = ECHO_CATALOG;

  get(baseId: string): EchoDefinition | undefined {
    return getEchoDefinition(baseId);
  }
}
