# 알바체크 - 웹 버전

Vite + React + TypeScript로 구축한 웹 애플리케이션입니다.

## 시작하기

### 설치
```bash
cd web
npm install
```

### 환경변수 설정
`.env.example`을 `.env.local`로 복사하고 Supabase 정보를 입력하세요:

```bash
cp .env.example .env.local
```

### 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열어주세요.

### 빌드
```bash
npm run build
```

빌드 결과는 `dist/` 폴더에 생성됩니다.

## 기술 스택

- **프레임워크**: React 18 + TypeScript
- **빌드 도구**: Vite
- **라우팅**: React Router v6
- **스타일**: Tailwind CSS
- **아이콘**: Lucide React
- **백엔드**: Supabase
- **인증**: Supabase Auth

## 주요 기능

- 사용자 인증 (회원가입/로그인)
- 대시보드 (근무 통계)
- 프로필 관리
- 반응형 UI (모바일/데스크톱)

## 폴더 구조

```
web/
├── public/           # 정적 파일
├── src/
│   ├── components/   # React 컴포넌트
│   ├── pages/        # 페이지 컴포넌트
│   ├── lib/          # 유틸리티 및 설정
│   ├── App.tsx       # 메인 앱 컴포넌트
│   ├── main.tsx      # 엔트리 포인트
│   └── index.css     # 글로벌 스타일
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 배포

### Vercel 배포 (권장)

1. GitHub에 레포지토리 푸시
2. [Vercel](https://vercel.com)에서 프로젝트 연결
3. 환경변수 설정
4. 자동 배포

### GitHub Pages 배포

```bash
npm run build
# dist 폴더의 내용을 GitHub Pages로 배포
```

## 환경변수

필수 환경변수:
- `VITE_SUPABASE_URL`: Supabase 프로젝트 URL
- `VITE_SUPABASE_ANON_KEY`: Supabase Anon Key

## 개발 팁

- HMR(Hot Module Replacement)을 활용한 빠른 개발
- TypeScript를 활용한 타입 안정성
- Tailwind CSS를 활용한 빠른 스타일링

## 라이센스

MIT
