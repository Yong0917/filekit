import type { Metadata, Viewport } from "next";
import "./globals.css";
import SwRegister from "@/components/SwRegister";

export const metadata: Metadata = {
  title: "FileKit – 무료 파일 변환 도구",
  description:
    "이미지 압축, PDF 변환, 이미지 포맷 변환, PDF 병합을 무료로. 파일이 서버에 업로드되지 않습니다.",
  keywords: ["이미지 압축", "PDF 변환", "이미지 변환", "PDF 병합", "무료"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FileKit",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        {children}
        <SwRegister />
      </body>
    </html>
  );
}
