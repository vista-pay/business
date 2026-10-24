import {
  CardIcon,
  ChartIcon,
  CodeIcon,
  DocumentIcon,
  HomeIcon,
  LinkIcon,
  PeopleIcon,
  SettingsIcon,
  SupportIcon,
  TransfersIcon,
  WalletIcon,
} from "./icons";

/** Nav from the Business-Dashboard frame, shared by the rail and the drawer. */
export const NAV = [
  { label: "Overview", href: "/overview", Icon: HomeIcon },
  { label: "Wallets", href: "/wallets", Icon: WalletIcon },
  { label: "Payments", href: "/payments", Icon: CardIcon },
  { label: "Transfers", href: "/transfers", Icon: TransfersIcon },
  { label: "Beneficiaries", href: "/beneficiaries", Icon: PeopleIcon },
  { label: "Payment Links", href: "/payment-links", Icon: LinkIcon },
  { label: "Invoices", href: "/invoices", Icon: DocumentIcon },
  { label: "Reports", href: "/reports", Icon: ChartIcon },
  { label: "Team", href: "/team", Icon: PeopleIcon },
  // { label: "Developers", href: "/api-keys", Icon: CodeIcon },
  { label: "Settings", href: "/settings", Icon: SettingsIcon },
];

export const SUPPORT_LINK = { label: "Support", href: "/support", Icon: SupportIcon };
