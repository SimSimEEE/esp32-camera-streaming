# 🚀 빠른 설정 가이드

도메인: **simsimeeeportfolio.duckdns.org**

## 1️⃣ EC2 SSH 접속

```bash
ssh -i ~/.ssh/your-key.pem ec2-user@52.79.241.244
```

## 2️⃣ DuckDNS 설정 스크립트 다운로드

EC2에서 실행:

```bash
# 스크립트 다운로드
cd ~
curl -O https://raw.githubusercontent.com/SimSimEEE/esp32-camera-streaming/master/setup-duckdns.sh
curl -O https://raw.githubusercontent.com/SimSimEEE/esp32-camera-streaming/master/setup-ssl.sh

# 또는 로컬에서 파일 직접 복사
```

## 3️⃣ DuckDNS 자동 업데이트 설정

```bash
chmod +x setup-duckdns.sh
sudo ./setup-duckdns.sh
```

입력할 정보:
- **DuckDNS 토큰**: (DuckDNS 사이트에서 복사)
- **서브도메인**: `simsimeeeportfolio`

## 4️⃣ SSL 인증서 발급

```bash
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

입력할 정보:
- **도메인**: `simsimeeeportfolio.duckdns.org`
- **이메일**: your-email@example.com

## 5️⃣ Security Group 설정

AWS Console → EC2 → Security Groups에서:

| Type | Port | Source |
|------|------|--------|
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

## 6️⃣ 테스트

```bash
# HTTPS 확인
curl -I https://simsimeeeportfolio.duckdns.org/health

# WebSocket 확인
wscat -c wss://simsimeeeportfolio.duckdns.org/viewer
```

## 7️⃣ 클라이언트 배포

로컬 머신에서:

```bash
cd esp32-camera-client

# Vercel 환경 변수 설정
vercel env add VITE_WS_URL production
# 입력: wss://simsimeeeportfolio.duckdns.org

# 배포
npm run deploy
```

---

## ✅ 완료!

- **HTTPS**: https://simsimeeeportfolio.duckdns.org
- **WebSocket**: wss://simsimeeeportfolio.duckdns.org/viewer
