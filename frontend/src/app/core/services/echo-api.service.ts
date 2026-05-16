import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FLUFFLING_ECHO_ID, getEchoDefinition } from '../data/echo-catalog';
import { PlayerSnapshot } from './player-store.service';

export interface DriftTickResponse {
  echo: PlayerSnapshot;
  appliedPassivePoints: number;
}

@Injectable({ providedIn: 'root' })
export class EchoApiService {
  private readonly http = inject(HttpClient);

  getEcho(playerId: string): Observable<PlayerSnapshot> {
    return this.http
      .get<PlayerSnapshot>(this.echoUrl(playerId), { headers: this.headers(playerId) })
      .pipe(map((dto) => this.normalizeSnapshot(dto)));
  }

  saveEcho(playerId: string, snapshot: PlayerSnapshot): Observable<PlayerSnapshot> {
    return this.http
      .put<PlayerSnapshot>(this.echoUrl(playerId), snapshot, { headers: this.headers(playerId) })
      .pipe(map((dto) => this.normalizeSnapshot(dto)));
  }

  quickCare(playerId: string, kind: string): Observable<PlayerSnapshot> {
    return this.http
      .post<PlayerSnapshot>(
        `${this.playersBase(playerId)}/echo/actions/quick-care`,
        { kind },
        { headers: this.headers(playerId) },
      )
      .pipe(map((dto) => this.normalizeSnapshot(dto)));
  }

  driftTick(playerId: string): Observable<DriftTickResponse> {
    return this.http
      .post<{ echo: PlayerSnapshot; appliedPassivePoints: number }>(
        `${this.playersBase(playerId)}/echo/drift/tick`,
        {},
        { headers: this.headers(playerId) },
      )
      .pipe(
        map((body) => ({
          echo: this.normalizeSnapshot(body.echo),
          appliedPassivePoints: body.appliedPassivePoints ?? 0,
        })),
      );
  }

  checkHealth(playerId: string): Observable<boolean> {
    return this.http
      .get<{ status: string }>(`${this.echoUrl(playerId)}/health`, { headers: this.headers(playerId) })
      .pipe(
        map(() => true),
        catchError(() => of(false)),
      );
  }

  private playersBase(playerId: string): string {
    return `${environment.apiBaseUrl}/players/${encodeURIComponent(playerId)}`;
  }

  private echoUrl(playerId: string): string {
    return `${this.playersBase(playerId)}/echo`;
  }

  private headers(playerId: string): HttpHeaders {
    return new HttpHeaders({ 'X-Player-Id': playerId });
  }

  private normalizeSnapshot(dto: PlayerSnapshot): PlayerSnapshot {
    const hatched = dto.hasHatched ?? !!dto.currentEcho;
    const rawIds = [...(dto.unlockedEchoIds ?? [])];
    const ids = rawIds.filter((id): id is string => !!id && !!getEchoDefinition(id));
    if (hatched && !ids.some((id) => id.toLowerCase() === FLUFFLING_ECHO_ID)) {
      ids.unshift(FLUFFLING_ECHO_ID);
    }

    let currentEcho = dto.currentEcho;
    if (currentEcho && !getEchoDefinition(currentEcho.echoId)) {
      currentEcho = { echoId: FLUFFLING_ECHO_ID, displayName: 'Fluffling' };
    }

    return {
      ...dto,
      version: 1,
      hasHatched: hatched,
      currentEcho: currentEcho ?? null,
      lastQuickCareAt: {
        pet: dto.lastQuickCareAt?.pet ?? 0,
        feed: dto.lastQuickCareAt?.feed ?? 0,
        encourage: dto.lastQuickCareAt?.encourage ?? 0,
      },
      unlockedEchoIds: ids,
      echoDanceCompletions: dto.echoDanceCompletions ?? 0,
      peakTotalResonanceAsFluffling: dto.peakTotalResonanceAsFluffling ?? 0,
    };
  }
}
