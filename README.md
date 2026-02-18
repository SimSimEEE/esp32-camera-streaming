# ESP32 Camera Streaming Project

ESP32-CAM을 이용한 실시간 카메라 스트리밍 시스템입니다. **3개의 완전히 독립적인 프로젝트**로 구성되어 있으며, 각각 독자적으로 개발 및 배포가 가능합니다.

## 🚀 빠른 배포

```bash
# 인터랙티브 배포 (추천)
./quick-deploy.sh

# 또는 전체 자동 배포
./deploy-production.sh
```

> 📘 **배포 가이드**:
> - [배포준비완료.md](배포준비완료.md) - 빠른 시작 (★ 시작은 여기서!)
> - [DEPLOY_GUIDE.md](DEPLOY_GUIDE.md) - 상세 배포 가이드
> - [DEPLOYMENT.md](DEPLOYMENT.md) - 클라우드 아키텍처

## 📋 프로젝트 구조 (독립 실행)

```
esp32-camera-streaming/
│
├── esp32-camera-server/        # 🖥️  Java WebSocket 서버
│   ├── package.json            # 서버 독립 실행 스크립트
│   ├── pom.xml                 # Maven 설정
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── README.md               # 서버 전용 문서
│
├── esp32-camera-client/        # 🌐 웹 클라이언트
│   ├── package.json            # 클라이언트 독립 실행 스크립트
│   ├── index.html
│   ├── app.js
│   ├── nginx.conf
│   └── README.md               # 클라이언트 전용 문서
│
└── esp32-camera-firmware/      # 📟 ESP32-CAM 펌웨어
    ├── package.json            # 펌웨어 독립 실행 스크립트
    ├── platformio.ini
    └── README.md               # 펌웨어 전용 문서
```

## 🎯 시스템 아키텍처

```
┌─────────────┐         WebSocket          ┌─────────────┐
│             │ ─────────────────────────→ │             │
│  ESP32-CAM  │     /esp32 (영상 전송)     │    Java     │
│             │                            │   Server    │
└─────────────┘                            │  (Port:8887)│
                                           │             │
┌─────────────┐         WebSocket          │             │
│     Web     │ ←───────────────────────── │             │
│   Browser   │   /viewer (영상 수신)       └─────────────┘
└─────────────┘
```

## ⚙️ 환경 변수 설정

각 사이드는 중앙 집중식 설정 파일을 사용합니다:

### ESP32 펌웨어

**설정 파일**: `Config.h`

```cpp
// WiFi 설정
#define WIFI_SSID        "YOUR_WIFI_SSID"
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"

// 서버 설정
#define WS_HOST          "YOUR_SERVER_IP"
#define WS_PORT          8887

// 카메라 설정
#define FRAME_INTERVAL   100      // 10 FPS
#define JPEG_QUALITY     12       // 품질
```

**위치**:

- Arduino: `ESP32_Camera_Stream/Config.h`
- PlatformIO: `src/Config.h`

### Java 서버

**설정 파일**: `ServerConfig.java`

```java
// 기본 포트
DEFAULT_PORT = 8887

// 엔드포인트
ENDPOINT_ESP32 = "/esp32"
ENDPOINT_VIEWER = "/viewer"

// 성능 설정
MAX_FRAME_SIZE = 1MB
CONNECTION_TIMEOUT = 30초
```

**환경 변수로 오버라이드**:

```bash
export SERVER_PORT=9000
export ENV=production
```

**위치**: `src/main/java/io/granule/camera/server/config/ServerConfig.java`

### 웹 클라이언트

**설정 파일**: `config.js`

```javascript
// 환경별 자동 감지
local: {
    wsUrl: "ws://localhost:8887/viewer";
}
production: {
    wsUrl: "ws://YOUR_DOMAIN/ws/viewer"; // 배포 시 수정
}
```

**위치**: `esp32-camera-client/config.js`

## 🚀 빠른 시작 (각 사이드별 독립 실행)

### 1️⃣ 서버 실행

```bash
cd esp32-camera-server

# 옵션 A: npm 스크립트 사용
npm run local              # Maven 빌드 후 실행
npm run info               # 서버 정보 확인

# 옵션 B: Docker 사용
npm run build             # Docker 이미지 빌드
npm run start             # Docker 컨테이너 실행

# 상세 가이드
cat README.md
```

### 2️⃣ 웹 클라이언트 실행

```bash
cd esp32-camera-client

# 옵션 A: Python HTTP 서버
npm run dev               # python3 -m http.server 8080

# 옵션 B: Node.js HTTP 서버
npm run dev:node          # npx http-server

# 브라우저에서 http://localhost:8080 접속
npm run open

# 상세 가이드
cat README.md
```

### 3️⃣ ESP32 펌웨어 업로드

```bash
cd esp32-camera-firmware

# WiFi 설정 확인
npm run config:wifi

# 빌드 및 업로드
npm run build             # 펌웨어 빌드
npm run upload            # ESP32에 업로드
npm run monitor           # 시리얼 모니터

# 상세 가이드
cat README.md
```

## 📦 각 사이드별 독립 배포

### 🖥️ 서버 배포

```bash
cd esp32-camera-server

# AWS ECR 푸시
npm run push

# EC2 배포
npm run deploy

# 배포 상태 확인
npm run deploy:status
```

### 🌐 클라이언트 배포

```bash
cd esp32-camera-client

# S3 업로드
npm run deploy

# CloudFront 캐시 무효화
npm run cdn:invalidate

# EC2 Nginx 동기화
npm run ec2:sync
```

### 📟 펌웨어 배포

```bash
cd esp32-camera-firmware

# OTA 업데이트
npm run ota:host
npm run upload:ota

# 다중 디바이스 배포
npm run deploy:batch
```

## 🔧 개발 워크플로우

### 서버 개발자

```bash
cd esp32-camera-server
npm run local:dev         # 개발 모드 실행
npm test                  # 테스트
npm run deploy            # 배포
```

### 프론트엔드 개발자

```bash
cd esp32-camera-client
npm run dev               # 로컬 서버
npm run deploy            # S3 배포
```

### 펌웨어 개발자

```bash
cd esp32-camera-firmware
npm run build             # 빌드
npm run upload:monitor    # 업로드 + 모니터
npm test                  # 테스트
```

## 📚 상세 문서

- **서버**: [esp32-camera-server/README.md](esp32-camera-server/README.md)
- **클라이언트**: [esp32-camera-client/README.md](esp32-camera-client/README.md)
- **펌웨어**: [esp32-camera-firmware/README.md](esp32-camera-firmware/README.md)
- **배포 가이드**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **외부 사용자**: [EXTERNAL_SETUP.md](EXTERNAL_SETUP.md)

## 💡 주요 특징

### 완전한 프로젝트 독립성

- ✅ 각 사이드는 독립적인 `package.json` 보유
- ✅ 별도의 빌드 및 배포 파이프라인
- ✅ 독립적인 버전 관리
- ✅ 팀별 분리 작업 가능

### 통합 아키텍처

- 🔄 WebSocket 실시간 통신
- 🎥 15 FPS HVGA 스트리밍
- 💡 LED 원격 제어
- 👥 다중 뷰어 동시 지원
- 📊 실시간 통계 표시

### 모듈 아키텍처

**ESP32 펌웨어 모듈**

- `CameraModule`: 카메라 초기화, 프레임 캡처, 센서 설정
- `LedModule`: LED/플래시 제어

**Java 서버 모듈**

- `ConnectionManager`: 클라이언트 연결 관리 (ESP32/웹 클라이언트 구분)
- `LedStateManager`: LED 상태 추적 및 명령 카운팅
- `FrameRelayService`: 프레임 중계 통계
- `ViewerStatsService`: 서버 가동시간 및 통계 관리

## 🎯 데이터 흐름

1. **ESP32-CAM** → 카메라로 영상 캡처 → JPEG 인코딩
2. **ESP32-CAM** → WebSocket `/esp32` → **Server**
3. **Server** → 프레임 중계 → WebSocket `/viewer`
4. **Web Client** → Canvas에 실시간 표시

## 🚀 빠른 시작

> 📘 **외부 사용자**: [EXTERNAL_SETUP.md](EXTERNAL_SETUP.md)에서 상세한 설치 가이드를 확인하세요.

> **⚠️ 중요**: 이 프로젝트는 `granule-core` 라이브러리에 의존합니다.  
> `granule-core`는 현재 비공개(private) 저장소이므로, 외부 사용자는 직접 빌드할 수 없습니다.
>
> **외부 사용자를 위한 옵션**:
>
> 1. **사전 빌드된 JAR 사용**: [Releases](releases) 페이지에서 다운로드
> 2. **독립 실행**: Java 17로 직접 서버 실행 (아래 참조)
> 3. **기여자**: granule-core 접근 권한 요청

### 방법 1: 사전 빌드된 서버 사용 (외부 사용자)

```bash
# 1. 서버 JAR 다운로드
# GitHub Releases에서 esp32-camera-server-1.0.0.jar 다운로드

# 2. 서버 실행
java -jar esp32-camera-server-1.0.0.jar

# 3. 웹 클라이언트 열기
cd esp32-camera-client
python3 -m http.server 8080
```

### 방법 2: 소스에서 빌드 (granule-core 접근 권한 있는 경우)

#### 1단계: Granule Core 설치

```bash
# Granule Core 빌드 및 로컬 Maven 저장소에 설치
cd ~/Documents/lemon/granule-core
mvn clean install -DskipTests
```

#### 2단계: 서버 빌드 및 실행

```bash
cd ~/Documents/lemon/esp32-camera-streaming/esp32-camera-server
mvn clean package
java -jar target/esp32-camera-server-1.0.0.jar
```

서버는 기본적으로 포트 8887에서 실행됩니다.

#### 3단계: 웹 클라이언트 열기

```bash
cd ~/Documents/lemon/esp32-camera-streaming/esp32-camera-client
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속 후 "연결" 버튼 클릭

### Docker 사용 (권장)

```bash
# 자동 빌드 스크립트 실행
./build.sh

# Docker Compose로 전체 스택 실행
docker compose up

# 브라우저에서 http://localhost 접속
```

### ESP32 펌웨어 설정

1. `esp32-camera-firmware/ESP32_Camera_Stream/ESP32_Camera_Stream.ino` 열기
2. WiFi 및 서버 설정 수정
3. ESP32-CAM에 업로드
4. 시리얼 모니터에서 연결 확인

## � LED 제어 사용법

웹 브라우저에서 ESP32-CAM의 내장 플래시 LED를 실시간으로 제어할 수 있습니다.

### 사용 방법

1. 웹 클라이언트 접속 후 **"연결"** 버튼 클릭
2. ESP32 연결되면 **"LED 제어"** 패널이 활성화됩니다
3. **"LED ON"** 버튼을 누르면 플래시 LED가 켜집니다
4. **"LED OFF"** 버튼을 누르면 플래시 LED가 꺼집니다
5. LED 상태는 실시간으로 표시됩니다

### 기술 구현

```
[Web Client] --"LED_ON"--> [WebSocket Server] --"LED_ON"--> [ESP32]
                                                                 ↓
[Web Client] <--"LED_STATUS:ON"-- [WebSocket Server] <--"LED_STATUS:ON"-- [ESP32]
```

- **웹→서버**: WebSocket TEXT 메시지로 LED 명령 전송
- **서버→ESP32**: 명령 중계
- **ESP32→서버**: GPIO 4 제어 후 상태 응답
- **서버→웹**: 상태 업데이트 표시

## �📦 각 프로젝트 상세 설명

### 1. ESP32 Camera Server

**위치**: `esp32-camera-server/`  
**기술**: Java 17, Maven, Granule Core, WebSocket  
**역할**: ESP32와 웹 클라이언트 간 WebSocket 연결 중계

#### 주요 기능

- ESP32로부터 영상 프레임 수신
- 다중 웹 클라이언트에게 브로드캐스트
- 웹에서 ESP32 LED 제어 명령 중계
- 연결 관리 및 로깅

#### 실행

```bash
cd esp32-camera-server
mvn clean package
java -jar target/esp32-camera-server-1.0.0.jar [포트번호]
```

자세한 내용은 [esp32-camera-server/README.md](esp32-camera-server/README.md) 참조

### 2. ESP32 Camera Client

**위치**: `esp32-camera-client/`  
**기술**: HTML5, CSS3, JavaScript (Vanilla)  
**역할**: 실시간 영상 스트림 표시

#### 주요 기능

- WebSocket 연결 관리
- Canvas를 통한 실시간 영상 렌더링
- 💡 **LED 제어 패널** (ON/OFF)
- FPS, 해상도, 데이터 통계 표시
- 연결 로그 및 상태 표시

#### 실행

```bash
cd esp32-camera-client
python3 -m http.server 8080
# 브라우저에서 http://localhost:8080 접속
```

자세한 내용은 [esp32-camera-client/README.md](esp32-camera-client/README.md) 참조

### 3. ESP32 Camera Firmware

**위치**: `esp32-camera-firmware/`  
**기술**: Arduino, C++, ESP32, WebSockets  
**역할**: 카메라 제어 및 영상 전송

#### 주요 기능

- ESP32-CAM 카메라 초기화
- WiFi 연결
- WebSocket 클라이언트
- 실시간 프레임 캡처 및 전송
- 💡 **내장 LED 제어** (GPIO 4)

#### 하드웨어

- ESP32-CAM (AI-Thinker)
- FTDI 프로그래머
- 5V 2A 전원

자세한 내용은 [esp32-camera-firmware/README.md](esp32-camera-firmware/README.md) 참조

## 🔧 환경 설정

### 서버

**요구사항**:

- Java 17 이상
- Maven 3.6 이상
- Granule Core 1.0.0

**설정**: 기본 포트 8887, 코드에서 변경 가능

### 클라이언트

**요구사항**:

- 모던 웹 브라우저 (Chrome, Firefox, Safari, Edge)
- HTTP 서버 (테스트용)

**설정**: `app.js`에서 WebSocket 서버 URL 수정

```javascript
this.wsUrl = "ws://localhost:8887/viewer";
```

### ESP32

**요구사항**:

- Arduino IDE
- ESP32 보드 패키지
- WebSockets 라이브러리

**설정**: `.ino` 파일에서 WiFi 및 서버 정보 수정

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WS_HOST = "192.168.0.100";
```

## 📊 성능 가이드

### 권장 설정 (균형)

- 해상도: VGA (640x480)
- 프레임 레이트: 10 FPS
- JPEG 품질: 10

### 고품질 설정

- 해상도: SVGA (800x600)
- 프레임 레이트: 5-8 FPS
- JPEG 품질: 8

### 빠른 전송 설정

- 해상도: QVGA (320x240)
- 프레임 레이트: 15-20 FPS
- JPEG 품질: 15

## 🔍 문제 해결

### 서버가 시작되지 않음

- Java 17 이상 설치 확인
- Granule Core 빌드 확인
- 포트 8887 사용 가능 확인

### 웹 클라이언트가 연결 안 됨

- 서버 실행 확인
- WebSocket URL 확인
- 브라우저 콘솔에서 에러 확인

### ESP32가 연결 안 됨

- WiFi 설정 확인
- 서버 IP 주소 확인
- 같은 네트워크에 있는지 확인
- 시리얼 모니터에서 로그 확인

### 영상이 느림

- WiFi 신호 강도 확인
- 프레임 레이트 낮추기
- 해상도 낮추기
- JPEG 품질 낮추기

## 🔐 보안 고려사항

⚠️ **경고**: 현재 구현은 데모/개발 목적입니다.

프로덕션 환경에서는 다음을 구현하세요:

- WSS (WebSocket Secure) 사용
- 인증 및 권한 관리
- 영상 암호화
- Rate limiting
- 접근 제어 리스트

## 📈 확장 가능성

### 구현된 기능

- [x] 💡 **웹에서 LED 제어** (ON/OFF)
    - WebSocket으로 실시간 LED ON/OFF 제어
    - 웹 UI에 LED 제어 패널 및 상태 표시
    - ESP32-CAM 내장 플래시 LED (GPIO 4) 사용

### 기능 추가

- [ ] 스냅샷 저장 기능
- [ ] 영상 녹화
- [ ] 다중 ESP32 지원
- [ ] 모션 감지
- [ ] 원격 제어 (팬/틸트)
- [ ] LED 밝기 조절 (PWM)

### 성능 개선

- [ ] H.264 스트리밍
- [ ] WebRTC 지원
- [ ] P2P 연결
- [ ] 적응형 품질 조정

## 📚 참고 자료

- [Granule Core](https://github.com/granule-io/granule-core)
- [ESP32-CAM 공식 문서](https://github.com/espressif/esp32-camera)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [Arduino ESP32](https://docs.espressif.com/projects/arduino-esp32/)

## 📝 라이선스

Copyright (C) 2026 Granule Co Ltd. - All Rights Reserved.

## 👨‍💻 작성자

**Sim Si-Geun** <sim@granule.io>

## 🤝 기여

버그 리포트 및 기능 제안은 GitHub Issues를 통해 제출해주세요.

---

**Made with ❤️ using Granule Core & ESP32-CAM**
