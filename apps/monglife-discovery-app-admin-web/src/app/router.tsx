import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from '@/shared/auth/ProtectedRoute';
import { AdminLayout } from './layout/AdminLayout';
import { LoginPage } from '@/features/login/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { AccountListPage } from '@/features/accounts/pages/AccountListPage';
import { AccountDetailPage } from '@/features/accounts/pages/AccountDetailPage';
import { DeviceListPage } from '@/features/devices/pages/DeviceListPage';
import { ActiveSessionsPage } from '@/features/sessions/pages/ActiveSessionsPage';
import { AppVersionListPage } from '@/features/app-versions/pages/AppVersionListPage';
import { NotificationPage } from '@/features/notifications/pages/NotificationPage';
import { ErrorReportListPage } from '@/features/error-reports/pages/ErrorReportListPage';
import { ErrorReportDetailPage } from '@/features/error-reports/pages/ErrorReportDetailPage';
import { NoticeListPage } from '@/features/mongs/notices/pages/NoticeListPage';
import { MemberListPage } from '@/features/mongs/members/pages/MemberListPage';
import { MemberDetailPage } from '@/features/mongs/members/pages/MemberDetailPage';
import { MongListPage } from '@/features/mongs/mongs/pages/MongListPage';
import { MongDetailPage } from '@/features/mongs/mongs/pages/MongDetailPage';
import { OrderListPage } from '@/features/mongs/orders/pages/OrderListPage';
import { OrderDetailPage } from '@/features/mongs/orders/pages/OrderDetailPage';
import { BattlePage } from '@/features/mongs/battle/pages/BattlePage';
import { MasterDataPage } from '@/features/mongs/master/pages/MasterDataPage';
import { GameStatsPage } from '@/features/mongs/stats/pages/GameStatsPage';
import { NotFoundPage } from './NotFoundPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'accounts', element: <AccountListPage /> },
          { path: 'accounts/:accountId', element: <AccountDetailPage /> },
          { path: 'devices', element: <DeviceListPage /> },
          { path: 'sessions', element: <ActiveSessionsPage /> },
          { path: 'app-versions', element: <AppVersionListPage /> },
          { path: 'notifications', element: <NotificationPage /> },
          { path: 'error-reports', element: <ErrorReportListPage /> },
          { path: 'error-reports/:reportId', element: <ErrorReportDetailPage /> },
          // mongs(게임) 관리 — 게이트웨이 경유
          { path: 'mongs/notices', element: <NoticeListPage /> },
          { path: 'mongs/members', element: <MemberListPage /> },
          { path: 'mongs/members/:accountId', element: <MemberDetailPage /> },
          { path: 'mongs/mongs', element: <MongListPage /> },
          { path: 'mongs/mongs/:mongId', element: <MongDetailPage /> },
          { path: 'mongs/orders', element: <OrderListPage /> },
          { path: 'mongs/orders/:orderId', element: <OrderDetailPage /> },
          { path: 'mongs/battle', element: <BattlePage /> },
          { path: 'mongs/master', element: <MasterDataPage /> },
          { path: 'mongs/stats', element: <GameStatsPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
