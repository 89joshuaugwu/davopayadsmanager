import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileTopBar from "./MobileTopBar";
import Footer from "./Footer";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-davo-bg">
      <Sidebar />
      <MobileTopBar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
