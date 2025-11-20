import type { Metadata } from "next";
import "./globals.css";
import { TRPCProvider } from "@/components/trpc-provider";

export const metadata: Metadata = {
  title: "Bilregister",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no">
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
