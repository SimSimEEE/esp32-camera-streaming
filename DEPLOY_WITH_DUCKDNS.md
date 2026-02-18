# 🚀 ESP32 Camera DuckDNS 배포 가이드

## 📋 목차

1. [DuckDNS 도메인 생성](#1-duckdns-도메인-생성)
2. [EC2 설정](#2-ec2-설정)
3. [클라이언트 배포](#3-클라이언트-배포)
4. [테스트](#4-테스트)

---

## 1. DuckDNS 도메인 생성

### 1.1 회원가입 및 도메인 등록

1. https://www.duckdns.org 접속
2. GitHub/Google 계정으로 로그인
3. 토큰 복사 (자동 생성됨)
4. 원하는 서브도메인 입력 (예: `esp32camera`)
5. EC2 Public IP 입력: `52.79.241.244`
6. **update ip** 클릭

✅ 완성된 도메인: `esp32camera.duckdns.org`

---

## 2. EC2 설정

### 2.1 Security Group 설정

AWS Console → EC2 → Security Groups에서:

| Type | Protocol | Port | Source |
|------|----------|------|--------|
| HTTP | TCP | 80 | 0.0.0.0/0 |
| HTTPS | TCP | 443 | 0.0.0.0/0 |
| Custom TCP | TCP | 8887 | 127.0.0.1/32 (localhost만) |
| SSH | TCP | 22 | My IP |

### 2.2 SSH 접속

```bash
ssh -i "your-key.pem" ec2-user@52.79.241.244
```

### 2.3 프로젝트 다운로드

```bash
cd ~
git clone https://github.com/SimSimEEE/esp32-camera-streaming.git
cd esp32-camera-streaming
```

### 2.4 DuckDNS 설정

```bash
chmod +x setup-duckdns.sh
sudo ./setup-duckdns.sh
```

입력 정보:
- **DuckDNS 토큰**: (1.1에서 복사한 토큰)
- **서브도메인**: `esp32camera`

### 2.5 SSL 인증서 발급

```bash
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

입력 정보:
- **도메인**: `esp32camera.duckdns.org`
- **이메일**: your-email@example.com

### 2.6 Java 서버 시작

```bash
cd esp32-camera-server

# Docker로 빌드
./build.sh

# 서버 실행
docker run -d \
  --name esp32-camera-server \
  --restart unless-stopped \
  -p 8887:8887 \
  esp32-camera-server:latest
```

---

## 3. 클라이언트 배포

### 3.1 환경 변수 설정

```bash
cd esp32-camera-client

# .env.local 파일 생성 (이미 생성됨)
# 내용 확인:
cat .env.local
```

```env
VITE_WS_URL=wss://esp32camera.duckdns.org
VITE_DEBUG=false
```

### 3.2 Vercel 환경 변수 설정

#### 방법 1: Vercel 대시보드
1. https://vercel.com 로그인
2. 프로젝트 → **Settings** → **Environment Variables**
3. 추가:
   - `VITE_WS_URL` = `wss://esp32camera.duckdns.org`
   - `VITE_DEBUG` = `false`

#### 방법 2: CLI
```bash
npm i -g vercel
vercel link

vercel env add VITE_WS_URL production
# 입력: wss://esp32camera.duckdns.org

vercel env add VITE_DEBUG production
# 입력: false
```

### 3.3 배포

```bash
# 빌드
npm run build

# Vercel 배포
npm run deploy
```

---

## 4. 테스트

### 4.1 서버 상태 확인

```bash
# SSH로 EC2 접속
ssh -i "your-key.pem" ec2-user@52.79.241.244

# 서비스 상태 확인
sudo systemctl status duckdns.timer
sudo systemctl status nginx
docker ps | grep esp32-camera-server

# 로그 확인
sudo journalctl -u duckdns -f
sudo journalctl -u nginx -f
docker logs -f esp32-camera-server
```

### 4.2 도메인 접속 테스트

```bash
# HTTPS 확인
curl -I https://esp32camera.duckdns.org/health

# WebSocket 확인
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  https://esp32camera.duckdns.org/viewer
```

### 4.3 웹 클라이언트 테스트

1. Vercel 배포 URL 접속
2. **Connect** 버튼 클릭
3. 브라우저 콘솔 확인 (F12)
   - WebSocket 연결 확인
   - 에러 메시지 확인

---

## 🎯 최종 구조

```
                                    ┌─────────────┐
                                    │   Vercel    │
                                    │  (HTTPS)    │
                                    └──────┬──────┘
                                           │
                                      WSS (443)
                                           │
                         ┌─────────────────▼──────────────────┐
                         │      esp32camera.duckdns.org       │
                         │         (SSL/Nginx)                │
                         └─────────────────┬──────────────────┘
                                           │
                                    Proxy (8887)
                                           │
                         ┌─────────────────▼──────────────────┐
                         │   Java WebSocket Server (8887)     │
                         └─────────────────┬──────────────────┘
                                           │
                                    Binary Frames
                                           │
                         ┌─────────────────▼──────────────────┐
                         │          ESP32-CAM                 │
                         │       (WiFi Connected)             │
                         └────────────────────────────────────┘
```

---

## 🔧 트러블슈팅

### SSL 인증서 오류
```bash
# 인증서 재발급
sudo certbot renew --force-renewal
sudo systemctl reload nginx
```

### DuckDNS IP 갱신 안됨
```bash
# 수동 갱신
sudo /usr/local/bin/duckdns-update.sh
cat /var/log/duckdns.log
```

### WebSocket 연결 실패
```bash
# Nginx 설정 확인
sudo nginx -t

# Java 서버 상태 확인
docker logs esp32-camera-server

# 포트 확인
sudo netstat -tlnp | grep 8887
```

---

## 📚 참고 문서

- [DUCKDNS_SETUP.md](../DUCKDNS_SETUP.md) - 상세 설정 가이드
- [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md) - Vercel 배포 상세
- [README.md](../README.md) - 프로젝트 개요

---

## ✅ 체크리스트

- [ ] DuckDNS 도메인 등록 완료
- [ ] EC2 Security Group 80, 443 포트 오픈
- [ ] DuckDNS 자동 업데이트 서비스 실행 중
- [ ] SSL 인증서 발급 완료
- [ ] Nginx WebSocket Proxy 설정 완료
- [ ] Java 서버 실행 중
- [ ] Vercel 환경 변수 설정 완료
- [ ] 클라이언트 배포 완료
- [ ] WebSocket 연결 테스트 성공

---

**🎉 배포 완료!**

이제 고정 URL `wss://esp32camera.duckdns.org`를 사용할 수 있습니다!
