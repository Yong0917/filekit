"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

// 클라이언트 전용 라이브러리이므로 dynamic import
const ImageCompress = dynamic(() => import("@/components/tools/ImageCompress"), { ssr: false });
const ImageToPdf = dynamic(() => import("@/components/tools/ImageToPdf"), { ssr: false });
const PdfCompress = dynamic(() => import("@/components/tools/PdfCompress"), { ssr: false });
const ImageConvert = dynamic(() => import("@/components/tools/ImageConvert"), { ssr: false });
const PdfMerge = dynamic(() => import("@/components/tools/PdfMerge"), { ssr: false });

const TABS = [
  { id: "image-compress", label: "이미지 압축", icon: "🗜️", component: ImageCompress },
  { id: "image-to-pdf", label: "이미지 → PDF", icon: "📄", component: ImageToPdf },
  { id: "pdf-compress", label: "PDF 압축", icon: "📦", component: PdfCompress },
  { id: "image-convert", label: "포맷 변환", icon: "🔄", component: ImageConvert },
  { id: "pdf-merge", label: "PDF 병합", icon: "🔗", component: PdfMerge },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("image-compress");

  const ActiveComponent = TABS.find((t) => t.id === activeTab)!.component;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* 헤더 */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <div>
              <h1 className="font-bold text-lg text-gray-900 dark:text-white leading-tight">
                FileKit
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">무료 파일 변환 도구</p>
            </div>
          </div>
          {/* 개인정보 보호 뱃지 */}
          <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2.5 py-1.5 rounded-full border border-green-200 dark:border-green-800">
            <span>🔒</span>
            <span className="hidden sm:inline">파일이 서버에 저장되지 않음</span>
            <span className="sm:hidden">로컬 처리</span>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  cursor-pointer flex items-center gap-1.5 px-3 py-3.5 text-sm whitespace-nowrap transition-colors border-b-2 flex-shrink-0
                  ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400 font-medium"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }
                `}
              >
                <span className="text-base">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden text-xs">{tab.label.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
          {/* 탭 제목 */}
          <div className="mb-5 pb-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {TABS.find((t) => t.id === activeTab)!.icon}{" "}
              {TABS.find((t) => t.id === activeTab)!.label}
            </h2>
          </div>

          <ActiveComponent />
        </div>

      </main>
    </div>
  );
}
