import { Component, inject, output } from '@angular/core';
import {
  getActivityOption,
  isTrainingActivityId,
  TRAINING_ACTIVITY_OPTIONS,
  WEEKDAY_LABELS,
  type TrainingActivityId,
} from '../../core/data/training-plan';
import { PlayerStore } from '../../core/services/player-store.service';

@Component({
  selector: 'app-week-planner',
  standalone: true,
  templateUrl: './week-planner.component.html',
  styleUrl: './week-planner.component.css',
})
export class WeekPlannerComponent {
  readonly store = inject(PlayerStore);
  readonly endWeek = output<void>();

  readonly weekdays = WEEKDAY_LABELS.map((label, index) => ({ label, index }));
  readonly activities = TRAINING_ACTIVITY_OPTIONS;

  slotValue(dayIndex: number): string {
    return this.store.trainingPlan()[dayIndex] ?? '';
  }

  slotHint(dayIndex: number): string {
    const id = this.store.trainingPlan()[dayIndex];
    return getActivityOption(id)?.hint ?? 'Pick a training focus for this day.';
  }

  onSlotChange(dayIndex: number, event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const activity: TrainingActivityId | null =
      value === '' ? null : isTrainingActivityId(value) ? value : null;
    this.store.setTrainingSlot(dayIndex, activity);
  }

  requestEndWeek(): void {
    if (!this.store.trainingPlanComplete()) {
      return;
    }
    this.endWeek.emit();
  }
}
