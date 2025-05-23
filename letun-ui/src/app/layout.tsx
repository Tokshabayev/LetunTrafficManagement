"use client";

import { usePathname } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/src/components/ui/sidebar";
import { AppSidebar } from "@/src/components/nav/app-sidebar";

import "./globals.css";
import { AppProvider } from "./app-provider";
import { Toaster } from "sonner";

const noLayoutRoutes = ["/login", "/invite"];

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isAuthPage = noLayoutRoutes.some(route => pathname.startsWith(route));

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
