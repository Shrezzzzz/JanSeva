export interface NotificationCreateInput {
  userId: string;
  title: string;
  message: string;
  issueId?: string;
  type: 'status_update' | 'verification' | 'comment' | 'resolution';
}
