# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

```bash
npm run dev      # 개발 서버 (Turbopack)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
```

## 아키텍처

**FileKit**은 파일 변환을 **100% 클라이언트 사이드**에서 처리하는 Next.js 앱이다. 파일이 서버로 전송되지 않는 것이 핵심 원칙이다.

### 데이터 흐름

```
app/page.tsx (탭 라우팅)
  └─ components/tools/*.tsx (각 도구 UI + 상태 관리)
       ├─ components/DropZone.tsx   (파일 입력)
       ├─ components/FileThumb.tsx  (미리보기)
       ├─ components/ProgressBar.tsx
       ├─ components/SizeDisplay.tsx
       └─ lib/*.ts (순수 변환 로직, DOM/React 의존성 없음)
```

### lib/ — 변환 로직

| 파일 | 라이브러리 | 역할 |
|------|-----------|------|
| `imageCompress.ts` | browser-image-compression | 이미지 압축 |
| `imageToPdf.ts` | jspdf | 이미지 → PDF |
| `pdfCompress.ts` | pdf-lib | PDF 재생성(압축) |
| `imageConvert.ts` | Canvas API | 이미지 포맷 변환 |
| `utils.ts` | — | formatBytes, downloadBlob 등 공통 유틸 |

PDF 병합(`PdfMerge`)은 별도 lib 없이 tools 컴포넌트 내부에서 pdf-lib를 직접 사용한다.

### 새 도구 추가 패턴

1. `lib/새기능.ts` — 변환 로직 (순수 함수)
2. `components/tools/새기능.tsx` — UI 컴포넌트 (`"use client"`)
3. `app/page.tsx`의 `TABS` 배열에 항목 추가 + `dynamic()` import

모든 tool 컴포넌트는 `next/dynamic`으로 lazy load하며 `ssr: false`로 설정해야 한다 (브라우저 전용 API 사용).

### 주요 제약

- `lib/` 함수들은 브라우저 환경에서만 동작 (`FileReader`, `Canvas`, `URL.createObjectURL` 등)
- SSR 불가 — 모든 tool 컴포넌트는 반드시 `dynamic(..., { ssr: false })`로 import
