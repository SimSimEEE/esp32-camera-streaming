# 🚀 ESP32 Camera Streaming - 클라우드 배포 가이드

## 📋 목차

1. [아키텍처 개요](#아키텍처-개요)
2. [로컬 Docker 테스트](#로컬-docker-테스트)
3. [배포 전략 가이드](#배포-전략-가이드)
4. [AWS 클라우드 배포](#aws-클라우드-배포)
5. [ESP32 펌웨어 업데이트](#esp32-펌웨어-업데이트)
6. [모니터링 및 운영](#모니터링-및-운영)

---

## 🏗️ 아키텍처 개요

```
┌─────────────┐         WebSocket (wss://)         ┌──────────────────┐
│  ESP32-CAM  │ ────────────────────────────────> │  Camera Server   │
└─────────────┘                                    │  (AWS App Runner)│
                                                   └──────────────────┘
                                                            │
                                                            │ WebSocket
                                                            ▼
┌─────────────┐         HTTPS                      ┌──────────────────┐
│ Web Client  │ <─────────────────────────────────>│   Static Site    │
│  (Browser)  │                                    │ (S3 + CloudFront)│
└─────────────┘                                    └──────────────────┘
```

### 구성 요소

- **Camera Server**: Java 17 기반 WebSocket 서버 (port 8887)
- **Web Client**: 정적 HTML/JS/CSS 파일
- **ESP32-CAM**: 카메라 모듈 (15 FPS HVGA)

---

## 🐳 로컬 Docker 테스트

### 1. 사전 준비

```bash
# Docker 및 Docker Compose 설치 확인
docker --version
docker compose version
```

### 2. granule-core 빌드

```bash
cd ~/Documents/lemon/granule-core
mvn clean install -DskipTests
```

### 3. Docker Compose로 전체 스택 실행

```bash
cd ~/Documents/lemon/esp32-camera-streaming

# 빌드 및 시작
docker compose up --build

# 백그라운드 실행
docker compose up -d

# 로그 확인
docker compose logs -f camera-server

# 종료
docker compose down
```

### 4. 로컬 테스트

- **웹 클라이언트**: http://localhost
- **WebSocket 서버**: ws://localhost/ws/viewer
- **ESP32 연결 주소**: ws://YOUR_LOCAL_IP/ws/esp32

---

## 🎯 배포 전략 가이드

### 서버와 클라이언트는 독립적으로 배포해야 하나요?

**답변: 예, 클라우드 배포 시 독립적으로 배포해야 합니다.** ✅

### 배포 시나리오 비교

#### 1️⃣ 로컬 개발 환경 (docker-compose)

```bash
# 서버 + 클라이언트 함께 실행 (편의성)
cd esp32-camera-server
docker compose up -d
```

**특징:**
- **목적**: 빠른 개발 및 테스트
- **구조**: 하나의 Docker 네트워크에서 함께 실행
- **사용 시점**: 로컬 개발, 통합 테스트
- **장점**: 설정 간단, 빠른 피드백

#### 2️⃣ 클라우드 배포 (독립 인스턴스)

**서버 배포** (동적 서비스):
```bash
# AWS App Runner 또는 EC2
cd esp32-camera-server
npm run deploy  # → App Runner/ECR 배포
```

- **인프라**: AWS App Runner / EC2 / ECS
- **이유**: WebSocket 서버는 **상시 실행** 필요
- **비용 모델**: vCPU/메모리 기반 ($12-20/월)
- **확장**: Auto Scaling 설정 가능

**클라이언트 배포** (정적 파일):
```bash
# S3 + CloudFront (CDN)
cd esp32-camera-client  
npm run deploy  # → S3 sync
```

- **인프라**: S3 + CloudFront (또는 Vercel/Netlify)
- **이유**: HTML/JS/CSS는 **CDN만으로 충분**
- **비용 모델**: 스토리지/트래픽 기반 ($1-3/월)
- **확장**: 자동 무제한 확장 (CDN)

### 왜 서버와 클라이언트를 분리하는가?

| 구분 | 서버 (Camera Server) | 클라이언트 (Web Client) |
|------|---------------------|------------------------|
| **타입** | 동적 서비스 (WebSocket) | 정적 파일 (HTML/JS/CSS) |
| **실행** | 상시 실행 필요 | 요청 시에만 제공 |
| **인프라** | App Runner / EC2 / ECS | S3 / CloudFront / CDN |
| **확장** | 수동/자동 스케일링 | CDN 자동 확장 |
| **비용** | 인스턴스 상시 요금 | 사용량 기반 요금 |
| **배포** | Docker 이미지 빌드 | 파일 업로드만 |
| **변경** | 재빌드 + 재배포 필요 | 파일만 교체 |

### 비용 비교

#### ✅ 분리 배포 (권장)

| 서비스 | 인프라 | 월 비용 |
|--------|--------|--------|
| Camera Server | AWS App Runner (1 vCPU, 2GB) | $15 |
| Web Client | S3 + CloudFront | $2 |
| ECR (Docker 이미지) | 1GB 저장 | $0.10 |
| **총계** | | **$17/월** |

**장점:**
- ✅ 클라이언트는 전 세계 CDN으로 빠른 속도
- ✅ 서버만 독립적으로 스케일링 가능
- ✅ 클라이언트 수정 시 서버 재배포 불필요
- ✅ 비용 효율적 (정적 파일은 CDN 캐싱)

#### ❌ 통합 배포 (비권장)

| 서비스 | 인프라 | 월 비용 |
|--------|--------|--------|
| Server + Nginx | EC2 t3.small (2 vCPU, 2GB) | $20-30 |
| **총계** | | **$20-30/월** |

**단점:**
- ❌ 클라이언트도 서버 인스턴스에서 제공 (비효율)
- ❌ CDN 없음 → 느린 글로벌 접속 속도
- ❌ 서버 재시작 시 클라이언트도 중단
- ❌ 트래픽 증가 시 서버 부하 증가

### 권장 배포 아키텍처

```
┌─────────────┐
│  ESP32-CAM  │
└──────┬──────┘
       │ wss://
       ▼
┌─────────────────────┐
│  Camera Server      │ ← 독립 배포 (App Runner)
│  ws://server/esp32  │    • WebSocket 서버 상시 실행
└──────┬──────────────┘    • Auto Scaling 가능
       │                   • $15/월
       │ wss://
       ▼
┌─────────────────────┐
│   Web Client        │ ← 독립 배포 (S3 + CloudFront)
│  HTML/JS/CSS        │    • CDN으로 전 세계 배포
└─────────────────────┘    • 무제한 확장
                           • $2/월
```

### 배포 워크플로우

**서버 변경 시:**
```bash
cd esp32-camera-server
npm run build          # Docker 이미지 빌드
npm run push           # ECR에 푸시
npm run deploy         # App Runner 배포
```

**클라이언트 변경 시:**
```bash
cd esp32-camera-client
npm run deploy         # S3 sync
npm run cdn:invalidate # CloudFront 캐시 무효화
```

**독립적인 배포로:**
- 서버 수정이 클라이언트에 영향 없음
- 클라이언트 수정이 서버에 영향 없음
- 각 팀이 독립적으로 작업 가능

---

## ☁️ AWS 클라우드 배포

### A. 서버 배포 (AWS App Runner)

#### 1. Dockerfile 검증

```bash
cd ~/Documents/lemon/esp32-camera-streaming/esp32-camera-server

# 로컬에서 Docker 이미지 빌드 테스트
docker build -t esp32-camera-server .

# 컨테이너 실행 테스트
docker run -p 8887:8887 esp32-camera-server

# 테스트 후 정리
docker stop $(docker ps -q --filter ancestor=esp32-camera-server)
```

#### 2. AWS ECR에 이미지 푸시

```bash
# AWS CLI 설정
aws configure

# ECR 리포지토리 생성
aws ecr create-repository --repository-name esp32-camera-server --region ap-northeast-2

# ECR 로그인
aws ecr get-login-password --region ap-northeast-2 | \
  docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com

# 이미지 태깅
docker tag esp32-camera-server:latest \
  YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/esp32-camera-server:latest

# 이미지 푸시
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/esp32-camera-server:latest
```

#### 3. AWS App Runner 생성

**AWS Console에서:**

1. **App Runner** 서비스 접속
2. **Create service** 클릭
3. **Source**: Container registry → Amazon ECR
4. **Image**: 위에서 푸시한 이미지 선택
5. **Port**: 8887
6. **Environment variables** (선택):
    - `SERVER_PORT`: 8887
    - `JAVA_OPTS`: -Xms256m -Xmx512m
7. **Create & deploy**

배포 완료 후 **서비스 URL**을 확인하세요:

- 예: `https://abc123.ap-northeast-2.awsapprunner.com`

#### 4. WebSocket wss:// 지원 확인

App Runner는 기본적으로 HTTPS/WSS를 지원합니다. 별도 설정 불필요합니다.

---

### B. 클라이언트 배포 (S3 + CloudFront)

#### 1. config.js 업데이트

```javascript
// esp32-camera-client/config.js
const CONFIG = {
    production: {
        wsUrl: "wss://abc123.ap-northeast-2.awsapprunner.com/viewer",
        esp32Endpoint: "wss://abc123.ap-northeast-2.awsapprunner.com/esp32",
    },
};
```

#### 2. S3 버킷 생성 및 업로드

```bash
# S3 버킷 생성
aws s3 mb s3://esp32-camera-viewer --region ap-northeast-2

# 정적 웹 호스팅 활성화
aws s3 website s3://esp32-camera-viewer --index-document index.html

# 파일 업로드
cd ~/Documents/lemon/esp32-camera-streaming/esp32-camera-client
aws s3 sync . s3://esp32-camera-viewer --acl public-read

# 버킷 정책 설정 (공개 읽기 허용)
cat > bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::esp32-camera-viewer/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket esp32-camera-viewer --policy file://bucket-policy.json
```

#### 3. CloudFront 배포 (선택, CDN 가속)

**AWS Console에서:**

1. **CloudFront** → **Create Distribution**
2. **Origin Domain**: S3 버킷 엔드포인트
3. **Viewer Protocol Policy**: Redirect HTTP to HTTPS
4. **Create Distribution**

배포 완료 후 CloudFront 도메인 확인:

- 예: `https://d1234567890abc.cloudfront.net`

---

### C. 대안: Vercel/Netlify 배포 (더 간단)

#### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
cd ~/Documents/lemon/esp32-camera-streaming/esp32-camera-client
vercel --prod
```

#### Netlify 배포

```bash
# Netlify CLI 설치
npm i -g netlify-cli

# 배포
cd ~/Documents/lemon/esp32-camera-streaming/esp32-camera-client
netlify deploy --prod --dir .
```

**환경변수 설정**: Vercel/Netlify 대시보드에서 `VITE_WS_URL` 등을 설정할 수 있습니다.

---

## 📡 ESP32 펌웨어 업데이트

### 1. main.cpp 수정

```cpp
// esp32-camera-firmware/src/main.cpp

// 기존 로컬 주소
// const char* WS_HOST = "192.168.200.179";
// const int WS_PORT = 8887;

// 클라우드 배포 주소로 변경
const char* WS_HOST = "abc123.ap-northeast-2.awsapprunner.com";
const int WS_PORT = 443;  // HTTPS/WSS 포트
const char* WS_PATH = "/esp32";
const bool USE_SSL = true;  // WSS 사용
```

### 2. WebSocket SSL 라이브러리 설정

**platformio.ini**에 SSL 지원 추가:

```ini
[env:esp32cam]
lib_deps =
    links2004/WebSockets @ ^2.7.3
    ; SSL 지원을 위한 추가 라이브러리
```

**main.cpp**에서 SSL 연결:

```cpp
#include <WiFiClientSecure.h>

WiFiClientSecure wifiClient;
WebSocketsClient webSocket;

void setup() {
    // SSL 인증서 검증 비활성화 (자체 서명 인증서용)
    wifiClient.setInsecure();

    // WebSocket 연결 with SSL
    webSocket.beginSSL(WS_HOST, WS_PORT, WS_PATH);
}
```

### 3. 펌웨어 업로드

```bash
cd ~/Documents/lemon/esp32-camera-streaming/esp32-camera-firmware
pio run -t upload
```

---

## 📊 모니터링 및 운영

### 로그 확인

**App Runner 로그:**

```bash
# CloudWatch Logs에서 확인
aws logs tail /aws/apprunner/esp32-camera-server --follow
```

**Docker Compose 로그:**

```bash
docker compose logs -f camera-server
```

### 성능 모니터링

- **AWS CloudWatch**: CPU, 메모리, 네트워크 트래픽
- **App Runner 메트릭**: 요청 수, 응답 시간, 에러율

### 비용 최적화

현재 설정 기준 월 예상 비용:

| 서비스          | 사양            | 월 비용      |
| --------------- | --------------- | ------------ |
| App Runner      | 1 vCPU, 2GB RAM | ~$12-$20     |
| S3 + CloudFront | 10GB 전송       | ~$1-$3       |
| ECR             | 1GB 이미지 저장 | ~$0.10       |
| **총계**        |                 | **~$13-$23** |

**절감 방법:**

- App Runner 대신 **Lambda + API Gateway** (서버리스, 사용량 기반)
- CloudFront 대신 **S3 정적 웹 호스팅** (HTTP only)

---

## 🔧 트러블슈팅

### 1. WebSocket 연결 실패

**증상**: 클라이언트에서 "WebSocket error" 발생

**해결**:

```javascript
// config.js에서 프로토콜 확인
wsUrl: "wss://..."; // HTTPS는 wss:// 필수
```

### 2. ESP32 연결 안 됨

**증상**: ESP32 시리얼 모니터에 "Connection failed"

**해결**:

- WiFi 연결 확인
- 서버 도메인 주소 정확한지 확인
- 방화벽/보안그룹 설정 확인 (포트 443 열림)

### 3. CORS 에러

**증상**: 브라우저 콘솔에 "CORS policy" 에러

**해결**:

- S3 버킷 CORS 설정
- CloudFront에서 `Access-Control-Allow-Origin` 헤더 추가

### 4. Docker 빌드 실패

**증상**: "granule-core not found"

**해결**:

```bash
# granule-core를 먼저 로컬 Maven 저장소에 설치
cd ~/Documents/lemon/granule-core
mvn clean install -DskipTests
```

---

## 🚀 다음 단계: 확장성 개선

### Redis Pub/Sub 도입 (다중 인스턴스 지원)

**목적**: 여러 서버 인스턴스 간 영상 데이터 공유

**구조**:

```
ESP32 → Server A → Redis Pub/Sub → Server B → Client
```

**구현 가이드**:

1. AWS ElastiCache (Redis) 생성
2. Java Redis 클라이언트 추가 (Lettuce/Jedis)
3. WebSocket 메시지를 Redis Pub/Sub으로 브로드캐스트
4. App Runner 인스턴스 수 증가

---

## 📚 참고 자료

- [AWS App Runner 문서](https://docs.aws.amazon.com/apprunner/)
- [Docker 공식 가이드](https://docs.docker.com/)
- [ESP32 WebSocket SSL](https://github.com/Links2004/arduinoWebSockets)
- [Vercel 배포 문서](https://vercel.com/docs)

---

**작성**: sim woo keun  
**날짜**: 2026-02-17  
**Copyright**: (C) 2026 Granule Co Ltd.
