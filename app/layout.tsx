import type { Metadata } from "next";
import { Sora } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/AuthContext";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DavoPay Ads Manager — TikTok Ads Account & Finance Tracker",
  description:
    "Manage Gmail accounts, business centers, and TikTok ads accounts with automated funding, spend, and loss tracking.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={sora.variable}>
      <body className="font-sora antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#173B8C",
                color: "#fff",
                fontFamily: "var(--font-sora)",
                fontSize: "14px",
                borderRadius: "12px",
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
