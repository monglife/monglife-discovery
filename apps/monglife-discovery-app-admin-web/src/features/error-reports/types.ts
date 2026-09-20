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
  /**
   * 앱이 붙인 진단 로그(logcat 조각). 별도 표에 있어 상세 응답에만 담긴다.
   * 구버전 앱이 보낸 신고에는 없다.
   */
  logs?: string | null;
  status: ErrorReportStatus;
  createdAt: string;
  reply?: ErrorReportReply | null;
}

export type ErrorReportSummary = Omit<ErrorReport, 'content' | 'logs'>;
