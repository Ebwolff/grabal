import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PrivacyProvider } from "@/context/PrivacyContext";
import { SidebarProvider } from "@/context/SidebarContext";
import { GlobalFilterProvider } from "@/context/GlobalFilterContext";
import { ToastProvider } from "@/components/ToastProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GramBal Investimentos — Inteligência Financeira Agrícola",
  description: "Plataforma de inteligência financeira para o agronegócio",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-br">
      <body className={inter.className}>
        <PrivacyProvider>
          <GlobalFilterProvider>
            <SidebarProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </SidebarProvider>
          </GlobalFilterProvider>
        </PrivacyProvider>
      </body>
    </html>
  );
}
