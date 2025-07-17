import type { Metadata } from "next";
import "./globals.css";


export const metadata: Metadata = {
  title: "HealthFlow Dashboard",
  description: "A web app dashboard for managing a small healthcare business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body className="font-body antialiased bg-slate-50" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
