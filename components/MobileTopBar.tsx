"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import Logo from "./Logo";
import { NAV_LINKS } from "./Sidebar";
import { useAuth } from "@/lib/AuthContext";

export default function MobileTopBar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    toast.success("Signed out.");
    router.replace("/login");
  }

  return (
    <>
      <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-davo-border no-print">
        <div className="h-16 flex items-center justify-between px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Logo className="h-6 w-auto" />
          </Link>
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="w-10 h-10 flex items-center justify-center rounded-full text-davo-navy hover:bg-davo-bg transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-davo-navy/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="w-72 h-full bg-white flex flex-col"
            >
              <div className="h-16 flex items-center justify-between px-5 border-b border-davo-border flex-shrink-0">
                <Logo className="h-6 w-auto" />
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="w-9 h-9 flex items-center justify-center rounded-full text-davo-muted hover:bg-davo-bg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 h-12 px-3 rounded-xl text-sm font-medium transition-colors ${
                        active
                          ? "bg-davo-blue text-white"
                          : "text-davo-muted hover:bg-davo-bg hover:text-davo-navy"
                      }`}
                    >
                      <Icon size={18} />
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
                  className="w-full flex items-center gap-3 h-12 px-3 rounded-xl text-sm font-medium text-davo-danger hover:bg-davo-danger-bg transition-colors"
                >
                  <LogOut size={18} /> Log out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
