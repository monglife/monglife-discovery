/** 사용자 오류 신고. 백엔드 AdminFeedbackController(/admin/error-reports) 와 1:1 */
export type ErrorReportStatus = 'OPEN' | 'ANSWERED';

/** 관리자 답변. 1회, 재답변은 덮어쓴다 */
export interface ErrorReportReply {
  content: string;
  /** 답변 이메일 발송 대상 */
  sentTo: string;
  createdAt: string;
}

export interface ErrorReport {
  reportId: number;
  accountId: number;
  email: string;
  name: string;
  deviceId: string;
  deviceName: string;
  appPackageName: string;
  buildVersion: string;
  title: string;
  content: string;
  status: ErrorReportStatus;
  createdAt: string;
  reply?: ErrorReportReply | null;
}

export type ErrorReportSummary = Omit<ErrorReport, 'content'>;
