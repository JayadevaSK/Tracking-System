import * as NotificationPreferenceModel from '../models/NotificationPreference';
import { NotificationPreference, NotificationPreferenceInput } from '../models/NotificationPreference';
import { WorkEntry } from '../models/WorkEntry';
import { config } from '../utils/config';
import nodemailer from 'nodemailer';

/**
 * Build a nodemailer transporter from config.
 * Requirements: 12.1
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
}

/**
 * Render a simple work entry notification email body.
 * Requirements: 12.1
 */
function renderWorkEntryTemplate(entry: WorkEntry): string {
  return `
A new work entry has been submitted.

Employee: ${entry.employeeId}
Description: ${entry.description}
Status: ${entry.status}
Date: ${new Date(entry.date).toDateString()}
${entry.duration ? `Duration: ${entry.duration} minutes` : ''}
  `.trim();
}

/**
 * Send a notification email when a work entry is created.
 * Silently skips if preferences are disabled or email is not configured.
 * Requirements: 12.1, 12.3, 12.4
 */
export async function sendWorkEntryNotification(
  managerId: string,
  entry: WorkEntry
): Promise<void> {
  try {
    const prefs = await NotificationPreferenceModel.findByUserId(managerId);
    if (!prefs || !prefs.emailEnabled || !prefs.notifyOnWorkEntry || !prefs.email) {
      return;
    }

    const transporter = createTransporter();
    await transporter.sendMail({
      from: config.email.from,
      to: prefs.email,
      subject: `Work Entry Submitted by ${entry.employeeId}`,
      text: renderWorkEntryTemplate(entry),
    });
  } catch (error) {
    // Log but do not propagate — notification failures must not break the main flow
    console.error('Failed to send work entry notification:', error);
  }
}

/**
 * Send a daily summary reminder notification.
 * Requirements: 12.3
 */
export async function sendReminderNotification(userId: string): Promise<void> {
  try {
    const prefs = await NotificationPreferenceModel.findByUserId(userId);
    if (!prefs || !prefs.emailEnabled || !prefs.notifyOnDailySummary || !prefs.email) {
      return;
    }

    const transporter = createTransporter();
    await transporter.sendMail({
      from: config.email.from,
      to: prefs.email,
      subject: 'Daily Work Summary Reminder',
      text: 'Please remember to log your work entries for today.',
    });
  } catch (error) {
    console.error('Failed to send reminder notification:', error);
  }
}

/**
 * Update notification preferences for a user.
 * Requirements: 12.2
 */
export async function updateNotificationPreferences(
  input: NotificationPreferenceInput
): Promise<NotificationPreference> {
  return NotificationPreferenceModel.upsert(input);
}

/**
 * Get notification preferences for a user.
 * Requirements: 12.2
 */
export async function getNotificationPreferences(
  userId: string
): Promise<NotificationPreference | null> {
  return NotificationPreferenceModel.findByUserId(userId);
}
