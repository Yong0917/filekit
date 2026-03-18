import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FileKit – 무료 파일 변환 도구",
  description:
    "이미지 압축, PDF 변환, 이미지 포맷 변환, PDF 병합을 무료로. 파일이 서버에 업로드되지 않습니다.",
  keywords: ["이미지 압축", "PDF 변환", "이미지 변환", "PDF 병합", "무료"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
