"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, FileBarChart, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import Logo from "./Logo";
import { useAuth } from "@/lib/AuthContext";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/reports", label: "Reports", icon: FileBarChart },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    toast.success("Signed out.");
    router.replace("/login");
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-davo-border no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Logo className="h-6 w-auto" />
          <span className="hidden sm:inline text-xs font-semibold text-davo-muted uppercase tracking-wide border-l border-davo-border pl-2">
            Ads Manager
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3 sm:px-4 h-10 rounded-full text-sm font-medium transition-colors ${
                  active
                    ? "bg-davo-blue text-white"
                    : "text-davo-muted hover:bg-davo-bg hover:text-davo-navy"
                }`}
              >
                <Icon size={16} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          <div className="hidden md:flex items-center gap-3 ml-3 pl-3 border-l border-davo-border">
            <span className="text-sm text-davo-muted truncate max-w-[160px]">
              {user?.email}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 sm:px-4 h-10 rounded-full text-sm font-medium text-davo-danger hover:bg-davo-danger-bg transition-colors ml-1"
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Log out</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
