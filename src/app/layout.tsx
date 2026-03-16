import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/ui/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "kokoro — カメラのいらないテレビ電話",
  description:
    "声とアバターだけで繋がる、スマホのメタバース。普通の会話がエンタメになる新世代音声SNS。",
  keywords: ["メタバース", "音声SNS", "VRM", "アバター", "ボイスチャット"],
  openGraph: {
    title: "kokoro — カメラのいらないテレビ電話",
    description: "声とアバターだけで繋がる、スマホのメタバース。",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.variable} font-sans antialiased bg-[#0f0a1a] text-white`}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
