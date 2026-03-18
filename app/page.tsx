"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// 클라이언트 전용 라이브러리이므로 dynamic import
const ImageCompress = dynamic(() => import("@/components/tools/ImageCompress"), { ssr: false });
const ImageToPdf    = dynamic(() => import("@/components/tools/ImageToPdf"),    { ssr: false });
const PdfCompress   = dynamic(() => import("@/components/tools/PdfCompress"),   { ssr: false });
const ImageConvert  = dynamic(() => import("@/components/tools/ImageConvert"),  { ssr: false });
const PdfMerge      = dynamic(() => import("@/components/tools/PdfMerge"),      { ssr: false });

const TABS = [
  { id: "image-compress", label: "이미지 압축",   shortLabel: "압축",    component: ImageCompress },
  { id: "image-to-pdf",   label: "이미지 → PDF",  shortLabel: "→ PDF",   component: ImageToPdf    },
  { id: "pdf-compress",   label: "PDF 압축",       shortLabel: "PDF 압축",component: PdfCompress   },
  { id: "image-convert",  label: "포맷 변환",      shortLabel: "변환",    component: ImageConvert  },
  { id: "pdf-merge",      label: "PDF 병합",       shortLabel: "병합",    component: PdfMerge      },
] as const;

type TabId = (typeof TABS)[number]["id"];

function isTabId(value: string): value is TabId {
  return TABS.some((t) => t.id === value);
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("image-compress");

  // URL ?tab= 파라미터로 초기 탭 설정 (PWA 바로가기 지원)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab && isTabId(tab)) setActiveTab(tab);
  }, []);

  const activeTabMeta = TABS.find((t) => t.id === activeTab);
  const ActiveComponent = activeTabMeta?.component ?? TABS[0].component;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>

      {/* ── 헤더 ── */}
      <header style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
        <div className="max-w-3xl mx-auto px-5 h-[54px] flex items-center justify-between">

          {/* 브랜드 */}
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon.svg"
              alt="FileKit 로고"
              width={28}
              height={28}
              className="rounded-[7px] flex-shrink-0"
              style={{ boxShadow: "0 1px 3px rgba(30,64,175,0.35)" }}
            />
            <div>
              <h1 className="text-[14px] font-semibold tracking-tight leading-none mb-[3px]" style={{ color: "var(--fg)" }}>
                FileKit
              </h1>
              <p className="text-[11px] leading-none" style={{ color: "var(--muted)" }}>
                브라우저 파일 변환
              </p>
            </div>
          </div>

          {/* 개인정보 보호 뱃지 */}
          <div
            className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
            style={{
              color: "var(--success)",
              background: "var(--success-bg)",
              border: "1px solid var(--success-border)",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <rect x="2" y="5" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
              <path d="M4 5V3.5A2 2 0 0 1 8 3.5V5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
            </svg>
            <span className="hidden sm:inline">파일이 서버에 저장되지 않음</span>
            <span className="sm:hidden">로컬 처리</span>
          </div>

        </div>
      </header>

      {/* ── 탭 네비게이션 ── */}
      <nav
        className="sticky top-0 z-10"
        style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="max-w-3xl mx-auto px-5">
          <div role="tablist" aria-label="파일 변환 도구 선택" className="flex overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className="cursor-pointer flex items-center px-3.5 py-3 text-[13px] whitespace-nowrap flex-shrink-0 border-b-[2px] transition-colors duration-150"
                  style={{
                    borderBottomColor: isActive ? "var(--accent)" : "transparent",
                    color: isActive ? "var(--accent)" : "var(--muted)",
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── 메인 컨텐츠 ── */}
      <main className="max-w-3xl mx-auto px-5 py-6">
        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          className="rounded-2xl overflow-hidden"
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* 패널 헤더 */}
          <div
            className="px-6 py-4"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <h2
              className="text-[15px] font-semibold tracking-tight"
              style={{ color: "var(--fg)" }}
            >
              {activeTabMeta?.label}
            </h2>
          </div>

          {/* 패널 본문 */}
          <div className="p-6">
            <ActiveComponent />
          </div>
        </div>
      </main>

    </div>
  );
}
