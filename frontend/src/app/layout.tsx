import type { Metadata } from "next";
import { Darker_Grotesque, Syne } from "next/font/google";
import { OfflineSync } from "@/components/offline-sync";
import "./globals.css";

const darkerGrotesque = Darker_Grotesque({
  variable: "--next-font-darker-grotesque",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--next-font-syne",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HerHours",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${darkerGrotesque.variable} ${syne.variable}`}>
      <body className="font-grotesque">
        {children}
        <OfflineSync />
      </body>
    </html>
  );
}
