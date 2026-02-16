# ESP32 Camera Firmware

ESP32-CAM 실시간 카메라 스트리밍을 위한 펌웨어입니다.

## 🔧 필요한 하드웨어

- **ESP32-CAM** (AI-Thinker 모델 권장)
- **FTDI 프로그래머** (USB to TTL Serial Converter)
- **전원 공급** (5V, 최소 2A 권장)
- **점퍼 케이블** (연결용)

## 📱 ESP32-CAM 보드 정보

ESP32-CAM은 ESP32 칩과 OV2640 카메라 모듈이 통합된 개발 보드입니다.

### 주요 특징
- ESP32-S dual-core processor
- Wi-Fi 및 Bluetooth 지원
- 2MP OV2640 camera
- MicroSD card slot
- Multiple GPIO pins
- Low power consumption

## 🔌 하드웨어 연결

### 프로그래밍 모드 (코드 업로드 시)

```
ESP32-CAM          FTDI Programmer
---------          ---------------
5V        ──────→  VCC (5V)
GND       ──────→  GND
U0R (RX)  ──────→  TX
U0T (TX)  ──────→  RX
GPIO 0    ──────→  GND (업로드 시만!)
```

**⚠️ 중요**: GPIO 0을 GND에 연결한 상태에서만 프로그래밍이 가능합니다.

### 실행 모드 (정상 작동 시)

1. GPIO 0과 GND 연결 **제거**
2. 리셋 버튼 누르기 또는 전원 재인가

## 💻 소프트웨어 설정

### 1. Arduino IDE 설치

[Arduino IDE 다운로드](https://www.arduino.cc/en/software)

### 2. ESP32 보드 매니저 추가

1. Arduino IDE 실행
2. `파일` → `환경설정`
3. "추가적인 보드 매니저 URLs"에 다음 추가:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. `도구` → `보드` → `보드 매니저`
5. "ESP32" 검색 후 설치

### 3. 필요한 라이브러리 설치

#### WebSockets 라이브러리
1. `스케치` → `라이브러리 포함하기` → `라이브러리 관리`
2. "WebSockets" by **Markus Sattler** 검색
3. 설치

## ⚙️ 코드 설정

`ESP32_Camera_Stream.ino` 파일을 열고 다음 항목들을 수정하세요:

### WiFi 설정

```cpp
const char* WIFI_SSID = "YOUR_WIFI_SSID";        // WiFi SSID
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD"; // WiFi 비밀번호
```

### 서버 설정

```cpp
const char* WS_HOST = "192.168.0.100";  // 서버 IP 주소
const uint16_t WS_PORT = 8887;          // 서버 포트
```

**서버 IP 확인 방법:**
- Windows: `ipconfig` 명령어
- Mac/Linux: `ifconfig` 또는 `ip addr show` 명령어

### 카메라 설정 (선택사항)

프레임 레이트 조정:
```cpp
const unsigned long FRAME_INTERVAL = 100; // 100ms = 10 FPS
```

해상도 및 품질:
```cpp
config.frame_size = FRAMESIZE_VGA;  // VGA (640x480)
config.jpeg_quality = 10;           // 0-63, 낮을수록 고품질
```

## 📤 업로드

### 보드 설정

1. `도구` → `보드` → **"ESP32 Wrover Module"** 선택
2. `도구` → `포트` → FTDI가 연결된 포트 선택
3. 다음 설정 확인:
   - Upload Speed: **115200**
   - Flash Frequency: **40MHz**
   - Flash Mode: **QIO**
   - Partition Scheme: **"Huge APP (3MB No OTA)"**

### 업로드 절차

1. **GPIO 0을 GND에 연결**
2. 리셋 버튼 누르기
3. Arduino IDE에서 **업로드** 버튼 클릭
4. 업로드 완료 대기
5. **GPIO 0과 GND 연결 제거**
6. 리셋 버튼 누르기

## 🔍 시리얼 모니터

업로드 후 동작 확인:

1. `도구` → `시리얼 모니터` (Ctrl+Shift+M)
2. Baud Rate: **115200** 선택
3. 다음과 같은 로그 확인:

```
========================================
ESP32-CAM WebSocket Stream Client
========================================
Initializing camera...
PSRAM found - using VGA quality
Camera initialized successfully

Connecting to WiFi: YourSSID
.....
WiFi connected!
IP address: 192.168.0.XXX
Signal strength (RSSI): -45

Connecting to WebSocket: ws://192.168.0.100:8887/esp32
[WS] Connected to: /esp32
Setup complete!
========================================
Frame #30 sent (12345 bytes)
Frame #60 sent (11234 bytes)
...
```

## 📊 해상도 옵션

코드에서 사용 가능한 해상도:

| 해상도 | 크기 | 설명 |
|--------|------|------|
| `FRAMESIZE_QVGA` | 320x240 | 낮은 해상도, 빠른 전송 |
| `FRAMESIZE_CIF` | 400x296 | - |
| `FRAMESIZE_VGA` | 640x480 | 권장 (균형) |
| `FRAMESIZE_SVGA` | 800x600 | 중간 해상도 |
| `FRAMESIZE_XGA` | 1024x768 | 높은 해상도 |
| `FRAMESIZE_SXGA` | 1280x1024 | - |
| `FRAMESIZE_UXGA` | 1600x1200 | 최고 해상도, 느린 전송 |

## 🔧 문제 해결

### 카메라 초기화 실패
```
Camera init failed with error 0x...
```

**해결 방법:**
- 전원 공급 확인 (2A 이상)
- 카메라 모듈 연결 상태 확인
- 보드 모델이 정확한지 확인

### WiFi 연결 실패
```
WiFi connection failed!
```

**해결 방법:**
- SSID와 비밀번호 재확인
- 2.4GHz WiFi 사용 확인 (5GHz 미지원)
- WiFi 신호 강도 확인
- 라우터 재시작

### WebSocket 연결 실패
```
[WS] Error occurred
```

**해결 방법:**
- 서버가 실행 중인지 확인
- 서버 IP 주소 확인
- 서버와 같은 네트워크에 있는지 확인
- 방화벽 설정 확인

### 영상이 느리거나 끊김
**해결 방법:**
- WiFi 신호 강도 개선
- `FRAME_INTERVAL` 값 증가
- `jpeg_quality` 값 증가 (낮은 품질)
- 해상도 낮추기

### 브라운아웃 리셋
```
Brownout detector was triggered
```

**해결 방법:**
- 더 강력한 전원 공급 장치 사용 (2A 이상)
- USB 허브 대신 직접 연결
- 코드에서 브라운아웃 디텍터 비활성화됨:
  ```cpp
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  ```

## 🎯 성능 튜닝

### 프레임 레이트 증가
```cpp
const unsigned long FRAME_INTERVAL = 50; // 50ms = 20 FPS
```

### 높은 품질 설정
```cpp
config.frame_size = FRAMESIZE_SVGA;  // 800x600
config.jpeg_quality = 8;             // 더 높은 품질
```

### 빠른 전송 (낮은 품질)
```cpp
config.frame_size = FRAMESIZE_QVGA;  // 320x240
config.jpeg_quality = 15;            // 낮은 품질
```

## 📚 추가 리소스

- [ESP32-CAM 공식 문서](https://github.com/espressif/esp32-camera)
- [Arduino ESP32 가이드](https://docs.espressif.com/projects/arduino-esp32/)
- [WebSockets 라이브러리](https://github.com/Links2004/arduinoWebSockets)

## 📝 라이선스

Copyright (C) 2026 LemonCloud Co Ltd. - All Rights Reserved.

## 👨‍💻 작성자

**Sim Si-Geun** <sim@lemoncloud.io>
