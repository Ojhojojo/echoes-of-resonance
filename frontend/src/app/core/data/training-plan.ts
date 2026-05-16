/** Mon–Fri training slot activity (MVP week planner). */
export type TrainingActivityId =
  | 'rest'
  | 'echo-dance'
  | 'harmony-garden'
  | 'drift-focus'
  | 'discipline-circuit'
  | 'rift-prep';

export const TRAINING_PLAN_DAYS = 5;

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

export interface TrainingActivityOption {
  id: TrainingActivityId;
  label: string;
  hint: string;
}

export const TRAINING_ACTIVITY_OPTIONS: readonly TrainingActivityOption[] = [
  { id: 'rest', label: 'Rest', hint: 'Recover fatigue' },
  { id: 'echo-dance', label: 'Echo Dance', hint: 'Joy — rhythm minigame' },
  { id: 'harmony-garden', label: 'Harmony Garden', hint: 'Harmony — puzzle' },
  { id: 'drift-focus', label: 'Drift Focus', hint: 'Passive resonance bias' },
  { id: 'discipline-circuit', label: 'Discipline Circuit', hint: 'Discipline — precision (stub)' },
  { id: 'rift-prep', label: 'Rift Prep', hint: 'Courage — adventure prep' },
] as const;

const ACTIVITY_IDS = new Set(TRAINING_ACTIVITY_OPTIONS.map((o) => o.id));

export type TrainingPlanSlot = TrainingActivityId | null;

export type TrainingPlan = [
  TrainingPlanSlot,
  TrainingPlanSlot,
  TrainingPlanSlot,
  TrainingPlanSlot,
  TrainingPlanSlot,
];

export function createEmptyTrainingPlan(): TrainingPlan {
  return [null, null, null, null, null];
}

export function isTrainingActivityId(value: string): value is TrainingActivityId {
  return ACTIVITY_IDS.has(value as TrainingActivityId);
}

export function isTrainingPlanComplete(plan: readonly TrainingPlanSlot[]): boolean {
  return plan.length === TRAINING_PLAN_DAYS && plan.every((slot) => slot !== null);
}

export function normalizeTrainingPlan(raw: unknown): TrainingPlan {
  const empty = createEmptyTrainingPlan();
  if (!Array.isArray(raw)) {
    return empty;
  }

  for (let i = 0; i < TRAINING_PLAN_DAYS; i++) {
    const slot = raw[i];
    if (typeof slot === 'string' && isTrainingActivityId(slot)) {
      empty[i] = slot;
    }
  }
  return empty;
}

export function getActivityOption(id: TrainingActivityId | null): TrainingActivityOption | undefined {
  if (!id) {
    return undefined;
  }
  return TRAINING_ACTIVITY_OPTIONS.find((o) => o.id === id);
}
