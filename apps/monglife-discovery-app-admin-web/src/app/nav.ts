import {
  BarChart3,
  Bell,
  Bug,
  Cat,
  Database,
  Gamepad2,
  LogIn,
  Megaphone,
  Package,
  PawPrint,
  ShoppingCart,
  Smartphone,
  Swords,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/**
 * 하위 그룹을 접었다 펼 수 있는 대메뉴.
 * 다른 서비스(mongs)의 관리 화면처럼 묶음이 큰 것만 이 형태로 둔다.
 */
export interface NavSection {
  title: string;
  icon: LucideIcon;
  /** 이 접두로 시작하는 경로에 있으면 자동으로 펼친다 */
  match: string;
  groups: NavGroup[];
}

export type NavEntry = NavGroup | NavSection;

export const isSection = (entry: NavEntry): entry is NavSection => 'groups' in entry;

/** 기능 정의 0 ~ 4 순서, 그 뒤에 mongs 대메뉴 */
export const NAV: NavEntry[] = [
  {
    title: '통계',
    items: [{ to: '/', label: '대시보드', icon: BarChart3, end: true }],
  },
  {
    title: '사용자 관리',
    items: [
      { to: '/accounts', label: '계정', icon: Users },
      { to: '/devices', label: '기기', icon: Smartphone },
    ],
  },
  {
    title: '로그인 관리',
    items: [{ to: '/sessions', label: '로그인 현황', icon: LogIn }],
  },
  {
    title: '앱 버전',
    items: [{ to: '/app-versions', label: '버전 관리', icon: Package }],
  },
  {
    title: '알림',
    items: [
      { to: '/notifications', label: '푸시 알림 전송', icon: Bell },
      { to: '/error-reports', label: '오류 신고', icon: Bug },
    ],
  },
  // monglife-mongs(게임 서비스)의 관리 API 를 게이트웨이 경유로 부른다
  {
    title: 'Mongs',
    icon: PawPrint,
    match: '/mongs',
    groups: [
      {
        title: '게임 운영',
        items: [
          { to: '/mongs/mongs', label: '몽', icon: Cat },
          { to: '/mongs/members', label: '멤버·포인트', icon: Gamepad2 },
          { to: '/mongs/orders', label: '주문', icon: ShoppingCart },
          { to: '/mongs/battle', label: '배틀', icon: Swords },
        ],
      },
      {
        title: '게임 콘텐츠',
        items: [
          { to: '/mongs/notices', label: '공지 사항', icon: Megaphone },
          { to: '/mongs/master', label: '마스터 데이터', icon: Database },
          { to: '/mongs/stats', label: '게임 통계', icon: BarChart3 },
        ],
      },
    ],
  },
];
