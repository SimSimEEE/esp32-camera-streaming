# DuckDNS 무료 도메인 설정 가이드

## 1단계: DuckDNS 서브도메인 생성 (5분)

### 1.1 DuckDNS 가입
1. https://www.duckdns.org 접속
2. GitHub/Google/Reddit 계정으로 로그인
3. 자동으로 **토큰**이 생성됨 (복사해두세요!)

### 1.2 서브도메인 등록
1. "domains" 섹션에서 원하는 이름 입력 (예: `esp32camera`)
2. "add domain" 클릭
3. 완성된 도메인: `esp32camera.duckdns.org`

### 1.3 IP 주소 설정
- EC2 Public IP: `52.79.241.244`를 current ip에 입력
- "update ip" 클릭

---

## 2단계: EC2에 DuckDNS 클라이언트 설치

### SSH로 EC2 접속 후 실행:

```bash
# 프로젝트 디렉토리로 이동
cd /home/ec2-user/esp32-camera-streaming

# DuckDNS 설정 스크립트 실행
chmod +x setup-duckdns.sh
sudo ./setup-duckdns.sh
```

### 설정 중 입력할 정보:
- **DuckDNS 토큰**: (1단계에서 복사한 토큰)
- **서브도메인**: `esp32camera` (또는 본인이 등록한 이름)

---

## 3단계: SSL 인증서 발급 (Let's Encrypt)

```bash
# SSL 인증서 자동 발급 스크립트 실행
sudo ./setup-ssl.sh
```

이 스크립트는 자동으로:
- Certbot 설치
- SSL 인증서 발급
- Nginx WebSocket Proxy 설정
- Auto-renewal 설정

---

## 4단계: Cloudflare Named Tunnel 설정

```bash
# Named Tunnel 생성 및 설정
sudo ./setup-cloudflare-tunnel.sh
```

---

## 5단계: 클라이언트 배포

```bash
# 로컬 머신에서
cd esp32-camera-client
npm run build
npm run deploy
```

---

## 최종 결과

✅ **고정 URL 사용 가능**:
- HTTP: `http://esp32camera.duckdns.org`
- HTTPS: `https://esp32camera.duckdns.org`
- WebSocket: `wss://esp32camera.duckdns.org/viewer`

✅ **자동 IP 업데이트**: EC2 재부팅 시에도 DuckDNS가 자동으로 IP 갱신

✅ **무료 SSL 인증서**: Let's Encrypt (90일마다 자동 갱신)

---

## 트러블슈팅

### DuckDNS IP가 갱신 안될 때:
```bash
# DuckDNS 서비스 상태 확인
sudo systemctl status duckdns

# 로그 확인
sudo journalctl -u duckdns -f

# 수동 갱신
sudo /usr/local/bin/duckdns-update.sh
```

### SSL 인증서 갱신 실패 시:
```bash
# Certbot 로그 확인
sudo certbot certificates

# 수동 갱신
sudo certbot renew --dry-run
```

### Cloudflare Tunnel 상태 확인:
```bash
# 서비스 상태
sudo systemctl status cloudflared-tunnel

# 터널 목록
sudo cloudflared tunnel list

# 로그 확인
sudo journalctl -u cloudflared-tunnel -f
```

---

## 참고 자료

- DuckDNS 공식 문서: https://www.duckdns.org/spec.jsp
- Certbot 가이드: https://certbot.eff.org/
- Cloudflare Tunnel 문서: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
