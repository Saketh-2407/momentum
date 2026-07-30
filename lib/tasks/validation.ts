export interface TaskDraft {
  title: string;
  notes?: string | null;
  category?: string | null;
  scheduledAt?: string | null;
  deadline?: string | null;
  importance: number;
  effort: number;
}

export type TaskValidationResult = { valid: true } | { valid: false; errors: string[] };

const MIN_SCALE = 1;
const MAX_SCALE = 5;
const MAX_TITLE_LENGTH = 200;

function isValidScale(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_SCALE && value <= MAX_SCALE;
}

/**
 * Validates a task before it's persisted. Deliberately does not reject
 * past-dated deadlines or scheduled times — an overdue task is a normal,
 * expected state the app must render correctly, not an invalid one.
 */
export function validateTaskDraft(draft: TaskDraft): TaskValidationResult {
  const errors: string[] = [];

  if (!draft.title.trim()) {
    errors.push("Title is required.");
  } else if (draft.title.trim().length > MAX_TITLE_LENGTH) {
    errors.push(`Title must be ${MAX_TITLE_LENGTH} characters or fewer.`);
  }

  if (!isValidScale(draft.importance)) {
    errors.push("Importance must be a whole number between 1 and 5.");
  }

  if (!isValidScale(draft.effort)) {
    errors.push("Effort must be a whole number between 1 and 5.");
  }

  if (draft.scheduledAt && Number.isNaN(Date.parse(draft.scheduledAt))) {
    errors.push("Scheduled time is not a valid date.");
  }

  if (draft.deadline && Number.isNaN(Date.parse(draft.deadline))) {
    errors.push("Deadline is not a valid date.");
  }

  return errors.length > 0 ? { valid: false, errors } : { valid: true };
}
