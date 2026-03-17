import type { Metadata, Viewport } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "./globals.css";

const rounded = M_PLUS_Rounded_1c({
  variable: "--font-rounded",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "cocoro — ともだちとおはなしできるアプリ",
  description:
    "かおをださなくても、アバターでたのしくおはなし！小学生がともだちと安心してつながれるビデオ通話アプリ。",
  keywords: ["ビデオ通話", "小学生", "アバター", "安心", "ボイスチャット", "ともだち"],
  openGraph: {
    title: "cocoro — ともだちとおはなしできるアプリ",
    description: "かおをださなくても、アバターでたのしくおはなし！",
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
      <body className={`${rounded.variable} font-sans antialiased bg-[#f0f7ff] text-gray-700`}>
        {children}
      </body>
    </html>
  );
}
