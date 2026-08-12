"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, FileBarChart, LogOut, Building2, Megaphone } from "lucide-react";
import toast from "react-hot-toast";
import Logo from "./Logo";
import { useAuth } from "@/lib/AuthContext";

export const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/analytics/business-centers", label: "Business Centers", icon: Building2 },
  { href: "/analytics/ads-accounts", label: "Ads Accounts", icon: Megaphone },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    toast.success("Signed out.");
    router.replace("/login");
  }

  return (
    <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-davo-border z-30 no-print">
      <div className="h-16 flex items-center px-6 border-b border-davo-border flex-shrink-0">
        <Link href="/dashboard">
          <Logo className="h-6 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-davo-blue text-white"
                  : "text-davo-muted hover:bg-davo-bg hover:text-davo-navy"
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-davo-border flex-shrink-0">
        <div className="px-3 py-2 mb-1">
          <p className="text-xs text-davo-muted truncate">{user?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 h-11 px-3 rounded-xl text-sm font-medium text-davo-danger hover:bg-davo-danger-bg transition-colors"
        >
          <LogOut size={17} /> Log out
        </button>
      </div>
    </aside>
  );
}
