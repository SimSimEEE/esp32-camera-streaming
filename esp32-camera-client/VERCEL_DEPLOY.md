# Vercel 배포 가이드

## 환경 변수 설정

### Vercel 대시보드에서 설정:

1. https://vercel.com 로그인
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. 다음 변수 추가:

| Name          | Value                           | Environment |
| ------------- | ------------------------------- | ----------- |
| `VITE_WS_URL` | `wss://esp32camera.duckdns.org` | Production  |
| `VITE_DEBUG`  | `false`                         | Production  |

### CLI로 설정:

```bash
# Vercel CLI 설치
npm i -g vercel

# 프로젝트 링크
vercel link

# 환경 변수 추가
vercel env add VITE_WS_URL production
# 입력: wss://esp32camera.duckdns.org

vercel env add VITE_DEBUG production
# 입력: false
```

## 배포

```bash
# Production 배포
npm run deploy

# 또는
vercel --prod
```

## 확인

배포 후 브라우저 콘솔에서 확인:

```javascript
console.log(import.meta.env.VITE_WS_URL);
// wss://esp32camera.duckdns.org
```

## 로컬 개발

로컬에서는 `.env.local` 파일을 사용:

```bash
# .env.local 파일 생성 (이미 생성됨)
cp .env.example .env.local

# 개발 서버 실행
npm run dev
```

## ⚠️ 주의사항

- `.env.local`은 Git에 커밋되지 않습니다 (`.gitignore`에 포함)
- Vercel 환경 변수는 빌드 시에만 적용됩니다
- 환경 변수 변경 후 반드시 재배포가 필요합니다
