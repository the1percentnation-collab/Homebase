import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  CalendarClock,
  Target,
  CreditCard,
  TrendingUp,
  Landmark,
  ListChecks,
  Wrench,
  Package,
  Hammer,
  ShoppingCart,
  UtensilsCrossed,
  CalendarDays,
  Sparkles,
  GraduationCap,
  PawPrint,
  Car,
  Phone,
  FileText,
  ShieldCheck,
  HeartPulse,
  KeyRound,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  comingSoon?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "Finances",
    items: [
      { label: "Expenses", href: "/finances/expenses", icon: Receipt },
      { label: "Income", href: "/finances/income", icon: Wallet },
      { label: "Budgets", href: "/finances/budgets", icon: PiggyBank },
      { label: "Bills", href: "/finances/bills", icon: CalendarClock },
      { label: "Goals", href: "/finances/goals", icon: Target },
      { label: "Debt", href: "/finances/debts", icon: CreditCard },
      { label: "Net Worth", href: "/finances/networth", icon: TrendingUp },
      { label: "Savings", href: "/finances/savings", icon: Landmark },
    ],
  },
  {
    label: "Home",
    items: [
      { label: "Tasks", href: "/home/tasks", icon: ListChecks },
      { label: "Maintenance", href: "/home/maintenance", icon: Wrench, comingSoon: true },
      { label: "Inventory", href: "/home/inventory", icon: Package, comingSoon: true },
      { label: "Projects", href: "/home/projects", icon: Hammer, comingSoon: true },
      { label: "Shopping", href: "/home/shopping", icon: ShoppingCart, comingSoon: true },
      { label: "Meals", href: "/home/meals", icon: UtensilsCrossed, comingSoon: true },
    ],
  },
  {
    label: "Family",
    items: [
      { label: "Calendar", href: "/family/calendar", icon: CalendarDays, comingSoon: true },
      { label: "Chores", href: "/family/chores", icon: Sparkles, comingSoon: true },
      { label: "School", href: "/family/school", icon: GraduationCap, comingSoon: true },
      { label: "Pets", href: "/family/pets", icon: PawPrint, comingSoon: true },
      { label: "Vehicles", href: "/family/vehicles", icon: Car, comingSoon: true },
      { label: "Contacts", href: "/family/contacts", icon: Phone, comingSoon: true },
    ],
  },
  {
    label: "Records",
    items: [
      { label: "Documents", href: "/records/documents", icon: FileText, comingSoon: true },
      { label: "Insurance", href: "/records/insurance", icon: ShieldCheck, comingSoon: true },
      { label: "Health", href: "/records/health", icon: HeartPulse, comingSoon: true },
      { label: "Accounts", href: "/records/accounts", icon: KeyRound, comingSoon: true },
    ],
  },
  {
    label: "Insights",
    items: [
      { label: "Reports", href: "/insights/reports", icon: BarChart3, comingSoon: true },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);
