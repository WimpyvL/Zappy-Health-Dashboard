import { ClientOnly } from "@/components/client-only";
import { FirebaseProvider } from "@/components/firebase-provider";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata = {
  title: "HealthFlow Dashboard",
  description: "A web app dashboard for managing a small healthcare business.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ClientOnly>
          <FirebaseProvider>{children}</FirebaseProvider>
        </ClientOnly>
        <Toaster />
      </body>
    </html>
  );
}
