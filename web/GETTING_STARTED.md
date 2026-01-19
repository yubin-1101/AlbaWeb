# 🚀 웹 버전 빠른 시작 가이드

## 1단계: Supabase 설정

### 1.1 Supabase 계정 생성
- https://supabase.com에 접속'
- 무료 계정 생성
- 새 프로젝트 생성

### 1.2 API 키 확인
- Settings → API 메뉴
- "Project URL" 복사
- "Anon Key" 복사

## 2단계: 환경변수 설정

```bash
cd web
cp .env.example .env.local
```

`.env.local` 파일 수정:
```
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

예시:
```
VITE_SUPABASE_URL=https://xyzabc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 3단계: 개발 서버 실행

```bash
npm run dev
```

### 실행 결과
- 브라우저가 자동으로 http://localhost:3000 열림
- 수정사항 저장 시 자동 새로고침 (HMR)

## 4단계: 첫 로그인

1. **가입하기** 버튼 클릭
2. 이메일 & 비밀번호 입력
3. 가입 완료
4. 로그인하기로 진행

## 5단계: 빌드 & 배포

### 로컬 빌드 테스트
```bash
npm run build  # dist/ 폴더 생성
npm run preview  # 빌드 결과 미리보기
```

### Vercel 배포

**방법 1: 웹 UI 사용 (권장)**
1. https://vercel.com 이동
2. GitHub 연결
3. alba 레포지토리 선택
4. Settings에서 Root Directory를 `web`으로 설정
5. Environment Variables 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
6. Deploy 버튼 클릭

**방법 2: Vercel CLI 사용**
```bash
npm i -g vercel
vercel
```

## 트러블슈팅

### 1. "Supabase 환경변수가 설정되지 않았습니다" 에러

→ `.env.local` 파일 확인
→ 파일명이 정확한지 확인 (`.env`가 아니라 `.env.local`)
→ 개발 서버 재시작

### 2. "Cannot find module" 에러

```bash
rm -rf node_modules
npm install
```

### 3. 로그인 실패

→ Supabase 프로젝트에서 Auth 활성화 확인
→ Settings → Auth 메뉴 확인
→ Supabase 콘솔에서 가입자 확인

### 4. 포트 3000이 이미 사용 중

```bash
npm run dev -- --port 3001
```

## 다음 단계

- [ ] Supabase 데이터베이스 테이블 생성
- [ ] 실제 API 연결 구현
- [ ] 고용주/근로자 기능 추가
- [ ] 모바일과 코드 공유
- [ ] 배포 및 도메인 설정

## 유용한 링크

- 📚 [Vite 문서](https://vitejs.dev)
- 📚 [React 문서](https://react.dev)
- 📚 [Supabase 문서](https://supabase.com/docs)
- 📚 [Tailwind CSS](https://tailwindcss.com/docs)
- 📚 [Vercel 배포 가이드](https://vercel.com/docs)

## 팁

1. **개발 속도 향상**: HMR(Hot Module Replacement) 활용
2. **디버깅**: 브라우저 DevTools 활용
3. **성능**: Lighthouse로 성능 측정
4. **타입 안정성**: TypeScript 엄격한 모드 활용

---

**문제가 발생하면 이 파일을 다시 확인하거나 GitHub Issues에 질문해주세요!**
