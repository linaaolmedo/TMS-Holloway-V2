import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { getImpersonationContext } from "@/lib/impersonation";
import { ImpersonationBanner } from "@/components/layout/impersonation-banner";

export const metadata: Metadata = {
  title: "BulkFlow TMS",
  description: "Transportation Management System for Bulk Agricultural Products",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const impersonationContext = await getImpersonationContext();

  return (
    <html lang="en">
      <body className={impersonationContext.isImpersonating ? "border-4 border-red-500" : ""}>
        <ToastProvider>
          {impersonationContext.isImpersonating && (
            <ImpersonationBanner
              targetUserName={impersonationContext.targetUserName || "Unknown User"}
              targetUserRole={impersonationContext.targetUserRole || "unknown"}
            />
          )}
          <div className={impersonationContext.isImpersonating ? "pt-14" : ""}>
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}

