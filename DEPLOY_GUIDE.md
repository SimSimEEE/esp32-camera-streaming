/\*\*

- `DEPLOY_GUIDE.md`
-   - ESP32 Camera Streaming 배포 가이드
-
- @author Sim Woo-Keun <smileteeth14@gmail.com>
- @date 2026-02-18 initial version
-
- @copyright (C) 2026 LemonCloud Co Ltd. - All Rights Reserved.
  \*/

# 🚀 ESP32 Camera Streaming 배포 가이드

## 📦 현재 배포 준비 상태

### ✅ 완료된 작업

- [x] Java 서버 v1.0.0 빌드 완료
- [x] Docker 이미지 생성 완료 (`esp32-camera-server:latest`)
- [x] 웹 클라이언트 파일 준비 완료
- [x] 모듈화 및 환경변수 중앙화 완료

---

## 🎯 배포 방법 선택

### 1️⃣ 로컬 테스트 배포 (추천: 먼저 테스트)

로컬에서 Docker로 서버를 실행하고 테스트합니다.

```bash
# 서버 실행 (포트 8887)
cd esp32-camera-server
npm run start

# 또는 백그라운드 실행
npm run start:bg

# 로그 확인
npm run logs

# 중지
npm run stop
```

**웹 클라이언트 실행**:

```bash
cd esp32-camera-client
npm run dev
# 브라우저에서 http://localhost:8080 접속
```

**테스트 확인**:

- ✅ 웹 페이지가 정상적으로 로드되는지 확인
- ✅ WebSocket 연결이 되는지 확인 (개발자 도구 콘솔 확인)
- ✅ 버전 정보가 표시되는지 확인 (페이지 하단)

---

### 2️⃣ AWS 클라우드 배포 (프로덕션)

#### 사전 준비

**AWS CLI 설정 확인**:

```bash
# AWS CLI 설치 확인
aws --version

# AWS 계정 확인
aws sts get-caller-identity

# 설정되지 않은 경우
aws configure
# - AWS Access Key ID 입력
# - AWS Secret Access Key 입력
# - Region: ap-northeast-2 (서울)
# - Output: json
```

#### 자동 배포 (추천)

```bash
# 전체 배포 (서버 + 클라이언트)
./deploy-production.sh
```

이 스크립트는 다음 작업을 자동으로 수행합니다:

1. ✅ ECR 리포지토리 생성/확인
2. ✅ Docker 이미지 빌드 및 태깅
3. ✅ ECR에 이미지 푸시
4. ✅ S3 버킷 생성/확인
5. ✅ 웹 클라이언트 파일 S3 업로드
6. ✅ 정적 웹 호스팅 설정

#### 수동 배포

**A. 서버 배포 (ECR)**:

```bash
cd esp32-camera-server

# ECR에 푸시
npm run push

# 또는 deploy-ecr.sh 사용
./deploy-ecr.sh
```

출력 예시:

```
Image URI: 123456789.dkr.ecr.ap-northeast-2.amazonaws.com/esp32-camera-server:latest
```

**B. App Runner 배포**:

1. AWS Console → App Runner 접속
2. "Create service" 클릭
3. 설정:
    - **Source**: Container registry → Amazon ECR
    - **Image URI**: 위에서 출력된 URI 입력
    - **Port**: 8887
    - **CPU/Memory**: 1 vCPU, 2 GB (권장)
4. "Create & deploy" 클릭
5. 배포 완료 후 서비스 URL 확인
    - 예: `https://xxx.ap-northeast-2.awsapprunner.com`

**C. 클라이언트 배포 (S3)**:

```bash
cd esp32-camera-client

# S3 배포
npm run deploy

# 확인
npm run deploy:check
```

S3 웹사이트 URL:

```
http://esp32-camera-viewer.s3-website-ap-northeast-2.amazonaws.com
```

**D. 환경 설정 업데이트**:

[config.js](esp32-camera-client/config.js) 파일의 `production` 섹션을 App Runner URL로 업데이트:

```javascript
production: {
    wsUrl: 'wss://xxx.ap-northeast-2.awsapprunner.com/viewer',  // App Runner URL
    reconnectInterval: 3000,
    heartbeatInterval: 30000
}
```

업데이트 후 재배포:

```bash
cd esp32-camera-client
npm run deploy
```

#### CloudFront 추가 (선택사항)

더 빠른 글로벌 액세스를 위해 CloudFront CDN 추가:

```bash
# CloudFront 배포 생성
aws cloudfront create-distribution --origin-domain-name esp32-camera-viewer.s3-website-ap-northeast-2.amazonaws.com

# CloudFront 무효화 (파일 업데이트 시)
cd esp32-camera-client
npm run cdn:invalidate
```

---

### 3️⃣ ESP32 펌웨어 업로드

#### Arduino IDE 사용

1. Arduino IDE 실행
2. **파일** → **열기** → `esp32-camera-firmware/ESP32_Camera_Stream/ESP32_Camera_Stream.ino`
3. **도구** → **보드** → **ESP32 Arduino** → **AI Thinker ESP32-CAM**
4. **도구** → **포트** → ESP32-CAM이 연결된 포트 선택
5. **스케치** → **업로드**

#### PlatformIO 사용 (추천)

```bash
cd esp32-camera-firmware

# PlatformIO 빌드
pio run

# ESP32에 업로드 (포트 자동 감지)
pio run --target upload

# 시리얼 모니터 확인
pio device monitor
```

**ESP32 연결 확인**:

```
WiFi connected
IP address: 192.168.x.x
Connecting to WebSocket: ws://server-url:8887/esp32
WebSocket connected!
```

#### 환경 변수 설정

ESP32 펌웨어 설정: [esp32-camera-firmware/ESP32_Camera_Stream/Config.h](esp32-camera-firmware/ESP32_Camera_Stream/Config.h)

```cpp
// WiFi 설정
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// WebSocket 서버 (로컬 테스트)
#define WS_HOST "192.168.1.100"  // 로컬 PC IP
#define WS_PORT 8887

// 또는 AWS App Runner (프로덕션)
#define WS_HOST "xxx.ap-northeast-2.awsapprunner.com"
#define WS_PORT 443
```

설정 변경 후 다시 빌드 및 업로드하세요.

---

## 🔍 배포 검증

### 1. 서버 상태 확인

**로컬**:

```bash
curl http://localhost:8887/
```

**AWS App Runner**:

```bash
curl https://xxx.ap-northeast-2.awsapprunner.com/
```

### 2. 웹 클라이언트 접속

**로컬**: http://localhost:8080

**AWS S3**: http://esp32-camera-viewer.s3-website-ap-northeast-2.amazonaws.com

**CloudFront** (선택): https://xxx.cloudfront.net

### 3. ESP32 연결 확인

ESP32 시리얼 모니터에서 다음 메시지 확인:

```
WiFi connected
WebSocket connected!
Camera initialized
Streaming started...
```

### 4. 전체 시스템 체크리스트

- [ ] 서버가 정상 실행 중
- [ ] 웹 클라이언트 페이지 로드 성공
- [ ] WebSocket 연결 성공 (개발자 도구 확인)
- [ ] ESP32 WiFi 연결 성공
- [ ] ESP32 WebSocket 서버 연결 성공
- [ ] 카메라 스트리밍 정상 작동
- [ ] LED 제어 정상 작동
- [ ] 버전 정보 표시 (Client v1.0.0, Server v1.0.0, Firmware v1.0.0)

---

## 🐛 트러블슈팅

### 문제 1: WebSocket 연결 실패

**증상**: 웹 페이지에서 "서버와의 연결이 끊어졌습니다" 메시지

**해결**:

1. 서버가 실행 중인지 확인: `docker ps | grep esp32-camera-server`
2. 방화벽/보안 그룹에서 8887 포트 개방 확인
3. [config.js](esp32-camera-client/config.js)의 WebSocket URL이 정확한지 확인

### 문제 2: ESP32 WiFi 연결 실패

**증상**: ESP32가 WiFi에 연결되지 않음

**해결**:

1. [Config.h](esp32-camera-firmware/ESP32_Camera_Stream/Config.h)의 SSID/비밀번호 확인
2. ESP32 근처 WiFi 신호 강도 확인
3. 2.4GHz WiFi 사용 확인 (5GHz 불가)

### 문제 3: 카메라 초기화 실패

**증상**: "Camera init failed" 메시지

**해결**:

1. ESP32-CAM 모듈 전원 재부팅
2. PSRAM 연결 확인
3. 카메라 모듈 케이블 연결 확인

### 문제 4: AWS ECR 푸시 실패

**증상**: "Unable to locate credentials"

**해결**:

```bash
# AWS 설정 확인
aws configure list

# 다시 로그인
aws configure
```

---

## 📊 모니터링

### 로그 확인

**로컬 Docker**:

```bash
cd esp32-camera-server
npm run logs
```

**AWS App Runner**:

- AWS Console → App Runner → 서비스 선택 → Logs 탭

**ESP32**:

```bash
cd esp32-camera-firmware
pio device monitor
```

### 서버 상태 확인

```bash
cd esp32-camera-server
npm run health
npm run deploy:status  # EC2 배포 시
```

---

## 🔄 업데이트 배포

### 서버 업데이트

```bash
cd esp32-camera-server

# 코드 수정 후
mvn clean package -DskipTests
docker build -t esp32-camera-server:latest .
npm run push

# App Runner에서 자동 재배포 또는 수동 재배포 트리거
```

### 클라이언트 업데이트

```bash
cd esp32-camera-client

# 파일 수정 후
npm run deploy

# CloudFront 사용 시 캐시 무효화
npm run cdn:invalidate
```

### 펌웨어 업데이트

```bash
cd esp32-camera-firmware

# 코드 수정 후
pio run --target upload
```

---

## 📚 추가 리소스

- [상세 배포 가이드](DEPLOYMENT.md)
- [아키텍처 문서](README.md)
- [외부 서비스 설정](EXTERNAL_SETUP.md)

---

## 💡 다음 단계

1. **로컬 테스트**: Docker로 로컬에서 먼저 테스트
2. **AWS 배포**: 테스트 성공 후 AWS에 배포
3. **ESP32 연결**: 펌웨어 업로드 및 연결 확인
4. **모니터링 설정**: CloudWatch 알람 설정 (선택)
5. **도메인 연결**: Route53으로 커스텀 도메인 연결 (선택)

---

**배포 성공을 기원합니다! 🎉**
