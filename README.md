# ESP32 Camera Streaming Project

ESP32-CAM을 이용한 실시간 카메라 스트리밍 시스템입니다. 3개의 독립적인 프로젝트로 구성되어 있습니다.

## 📋 프로젝트 구조

```
esp32-camera-streaming/
├── esp32-camera-server/        # Java WebSocket 서버 (Granule Core 사용)
│   ├── src/
│   ├── pom.xml
│   └── README.md
│
├── esp32-camera-client/        # 웹 클라이언트 (HTML/CSS/JS)
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   └── README.md
│
└── esp32-camera-firmware/      # ESP32-CAM 펌웨어 (Arduino)
    ├── ESP32_Camera_Stream/
    │   └── ESP32_Camera_Stream.ino
    └── README.md
```

## 🎯 시스템 아키텍처

```
┌─────────────┐         WebSocket          ┌─────────────┐
│             │ ─────────────────────────→ │             │
│  ESP32-CAM  │     /esp32 (영상 전송)     │    Java     │
│             │                            │   Server    │
└─────────────┘                            │ (Granule)   │
                                           │    Core     │
┌─────────────┐         WebSocket          │             │
│     Web     │ ←───────────────────────── │             │
│   Browser   │   /viewer (영상 수신)       └─────────────┘
└─────────────┘
```

### 데이터 흐름

1. **ESP32-CAM** → 카메라로 영상 캡처 → JPEG 인코딩
2. **ESP32-CAM** → WebSocket `/esp32` → **Server**
3. **Server** → 프레임 중계 → WebSocket `/viewer`
4. **Web Client** → Canvas에 실시간 표시

## 🚀 빠른 시작

### 1. Granule Core 설치

```bash
# Granule Core 빌드 및 설치
cd /Users/sim-ugeun/Documents/lemon/granule-core
mvn clean install
```

### 2. 서버 실행

```bash
cd esp32-camera-server
mvn clean package
java -jar target/esp32-camera-server-1.0.0.jar
```

서버는 기본적으로 포트 8887에서 실행됩니다.

### 3. 웹 클라이언트 열기

```bash
cd esp32-camera-client
python3 -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속 후 "연결" 버튼 클릭

### 4. ESP32 설정 및 업로드

1. `esp32-camera-firmware/ESP32_Camera_Stream/ESP32_Camera_Stream.ino` 열기
2. WiFi 및 서버 설정 수정
3. ESP32-CAM에 업로드
4. 시리얼 모니터에서 연결 확인

## 📦 각 프로젝트 상세 설명

### 1. ESP32 Camera Server

**위치**: `esp32-camera-server/`  
**기술**: Java 17, Maven, Granule Core, WebSocket  
**역할**: ESP32와 웹 클라이언트 간 WebSocket 연결 중계

#### 주요 기능
- ESP32로부터 영상 프레임 수신
- 다중 웹 클라이언트에게 브로드캐스트
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
this.wsUrl = 'ws://localhost:8887/viewer';
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

### 기능 추가
- [ ] 스냅샷 저장 기능
- [ ] 영상 녹화
- [ ] 다중 ESP32 지원
- [ ] 모션 감지
- [ ] 원격 제어 (팬/틸트)

### 성능 개선
- [ ] H.264 스트리밍
- [ ] WebRTC 지원
- [ ] P2P 연결
- [ ] 적응형 품질 조정

## 📚 참고 자료

- [Granule Core](https://github.com/lemoncloud-io/granule-core)
- [ESP32-CAM 공식 문서](https://github.com/espressif/esp32-camera)
- [WebSocket Protocol](https://tools.ietf.org/html/rfc6455)
- [Arduino ESP32](https://docs.espressif.com/projects/arduino-esp32/)

## 📝 라이선스

Copyright (C) 2026 LemonCloud Co Ltd. - All Rights Reserved.

## 👨‍💻 작성자

**Sim Si-Geun** <sim@lemoncloud.io>

## 🤝 기여

버그 리포트 및 기능 제안은 GitHub Issues를 통해 제출해주세요.

---

**Made with ❤️ using Granule Core & ESP32-CAM**
