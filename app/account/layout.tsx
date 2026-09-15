import type { ReactNode } from "react";
import AccountDashboardShell from "../components/account-dashboard-shell";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <AccountDashboardShell>{children}</AccountDashboardShell>;
}
