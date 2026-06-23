import { logger } from '../utils/logger';

/** In production, swap this with nodemailer/sendgrid/firebase etc. */
export async function sendEmailNotification(to: string, subject: string, body: string) {
  if (process.env.NODE_ENV === 'development') {
    logger.info(`[EMAIL] To: ${to} | Subject: ${subject}`);
    return;
  }
  // TODO: integrate nodemailer with SMTP_HOST env
}

export async function notifyStatusUpdate(params: {
  reporterEmail: string;
  issueTitle: string;
  newStatus: string;
  issueId: string;
}) {
  const { reporterEmail, issueTitle, newStatus, issueId } = params;
  await sendEmailNotification(
    reporterEmail,
    `Issue Update: ${issueTitle}`,
    `Your reported issue "${issueTitle}" has been updated to status: ${newStatus}.\n\nTrack it at: ${process.env.FRONTEND_URL}/track/${issueId}`,
  );
}
