import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/ui/BottomNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "kokoro — 声だけで繋がる、認知メタバース",
  description:
    "カメラもAIクラウドも要らない。声の感情がオーラを纏い、空間があなたを覚える。2026年の新しいコミュニケーション。",
  keywords: ["メタバース", "音声SNS", "VRM", "アバター", "ボイスチャット", "感情知能", "空間記憶"],
  openGraph: {
    title: "kokoro — 声だけで繋がる、認知メタバース",
    description: "感情がオーラを纏い、空間があなたを覚える。2026年の声だけのメタバース。",
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
      <body className={`${inter.variable} ${notoSansJP.variable} font-sans antialiased bg-[#0f0a1a] text-white`}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
