import { db } from '../utils/db';

/**
 * NotificationPreference interface
 * Requirements: 12.2
 */
export interface NotificationPreference {
  id: string;
  userId: string;
  emailEnabled: boolean;
  notifyOnWorkEntry: boolean;
  notifyOnDailySummary: boolean;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPreferenceInput {
  userId: string;
  emailEnabled?: boolean;
  notifyOnWorkEntry?: boolean;
  notifyOnDailySummary?: boolean;
  email?: string;
}

const SELECT_COLS = `
  id,
  user_id as "userId",
  email_enabled as "emailEnabled",
  notify_on_work_entry as "notifyOnWorkEntry",
  notify_on_daily_summary as "notifyOnDailySummary",
  email,
  created_at as "createdAt",
  updated_at as "updatedAt"
`;

/**
 * Upsert notification preferences for a user.
 * Requirements: 12.2
 */
export async function upsert(
  input: NotificationPreferenceInput
): Promise<NotificationPreference> {
  const query = `
    INSERT INTO notification_preferences
      (user_id, email_enabled, notify_on_work_entry, notify_on_daily_summary, email)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (user_id)
    DO UPDATE SET
      email_enabled = EXCLUDED.email_enabled,
      notify_on_work_entry = EXCLUDED.notify_on_work_entry,
      notify_on_daily_summary = EXCLUDED.notify_on_daily_summary,
      email = EXCLUDED.email,
      updated_at = CURRENT_TIMESTAMP
    RETURNING ${SELECT_COLS}
  `;
  const result = await db.query<NotificationPreference>(query, [
    input.userId,
    input.emailEnabled ?? true,
    input.notifyOnWorkEntry ?? true,
    input.notifyOnDailySummary ?? false,
    input.email ?? null,
  ]);
  return result.rows[0];
}

/**
 * Find notification preferences by user ID.
 * Requirements: 12.2
 */
export async function findByUserId(
  userId: string
): Promise<NotificationPreference | null> {
  const query = `SELECT ${SELECT_COLS} FROM notification_preferences WHERE user_id = $1`;
  const result = await db.query<NotificationPreference>(query, [userId]);
  return result.rows[0] || null;
}
