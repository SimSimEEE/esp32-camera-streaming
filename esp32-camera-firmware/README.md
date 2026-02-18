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

### 방법 1: PlatformIO (권장)

PlatformIO는 현대적인 IDE로 의존성 관리와 빌드가 자동화되어 더 편리합니다.

#### 1. VS Code와 PlatformIO 설치

1. [Visual Studio Code](https://code.visualstudio.com/) 설치
2. VS Code에서 Extensions (Ctrl+Shift+X)
3. "PlatformIO IDE" 검색 후 설치
4. VS Code 재시작

#### 2. 프로젝트 열기

```bash
cd esp32-camera-firmware
code .
```

#### 3. 코드 설정

**⚠️ 중요**: 모든 설정값은 `Config.h` 파일에서 중앙 관리됩니다.

**PlatformIO**: `src/Config.h` 파일 수정  
**Arduino IDE**: `ESP32_Camera_Stream/Config.h` 파일 수정

**WiFi 설정:**

```cpp
#define WIFI_SSID        "YOUR_WIFI_SSID"        // 본인의 WiFi SSID
#define WIFI_PASSWORD    "YOUR_WIFI_PASSWORD"    // 본인의 WiFi 비밀번호
```

**서버 설정:**

```cpp
#define WS_HOST          "YOUR_SERVER_IP_OR_DOMAIN"  // 서버 IP 또는 도메인
#define WS_PORT          8887                         // 서버 포트
#define WS_PATH          "/esp32"                     // WebSocket 경로
```

**카메라 설정 (선택사항):**

```cpp
#define FRAME_INTERVAL   100              // 프레임 간격 (ms) - 100ms = 10 FPS
#define JPEG_QUALITY     12               // JPEG 품질 (0-63, 낮을수록 고품질)
#define FRAME_SIZE       FRAMESIZE_HVGA   // 해상도: HVGA (480x320)
```

**LED 설정 (선택사항):**

```cpp
#define LED_FLASH_PIN    4                // 내장 플래시 LED
```

**디버그 설정 (선택사항):**

```cpp
#define DEBUG_ENABLED     true            // 디버그 로그 활성화/비활성화
```

#### 4. 빌드 및 업로드

**하드웨어 준비:**

1. **GPIO 0을 GND에 연결**
2. FTDI를 컴퓨터에 연결
3. 리셋 버튼 누르기

**VS Code에서:**

1. PlatformIO 메뉴 열기 (왼쪽 사이드바의 개미 아이콘)
2. "Upload" 클릭 또는 단축키 사용

**명령줄에서:**

```bash
# 빌드만
pio run

# 빌드 및 업로드
pio run --target upload

# 시리얼 모니터
pio device monitor
```

**업로드 후:**

1. **GPIO 0과 GND 연결 제거**
2. 리셋 버튼 누르기

#### 5. 시리얼 모니터

```bash
pio device monitor
```

또는 VS Code에서 "Monitor" 버튼 클릭

### 방법 2: Arduino IDE

#### 1. Arduino IDE 설치

[Arduino IDE 다운로드](https://www.arduino.cc/en/software)

#### 2. ESP32 보드 매니저 추가

1. Arduino IDE 실행
2. `파일` → `환경설정`
3. "추가적인 보드 매니저 URLs"에 다음 추가:
    ```
    https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
    ```
4. `도구` → `보드` → `보드 매니저`
5. "ESP32" 검색 후 설치

#### 3. 필요한 라이브러리 설치

**WebSockets 라이브러리:**

1. `스케치` → `라이브러리 포함하기` → `라이브러리 관리`
2. "WebSockets" by **Markus Sattler** 검색
3. 설치

#### 4. 코드 설정

**⚠️ 중요**: `ESP32_Camera_Stream/Config.h` 파일에서 모든 설정을 관리합니다.

설정 방법은 위 **PlatformIO 섹션 3**을 참조하세요.

#### 5. 업로드

**보드 설정:**

1. `도구` → `보드` → **"ESP32 Wrover Module"** 선택
2. `도구` → `포트` → FTDI가 연결된 포트 선택
3. 다음 설정 확인:
    - Upload Speed: **115200**
    - Flash Frequency: **40MHz**
    - Flash Mode: **QIO**
    - Partition Scheme: **"Huge APP (3MB No OTA)"**

**업로드 절차:**

1. **GPIO 0을 GND에 연결**
2. 리셋 버튼 누르기
3. Arduino IDE에서 **업로드** 버튼 클릭
4. 업로드 완료 대기
5. **GPIO 0과 GND 연결 제거**
6. 리셋 버튼 누르기

## 🔍 시리얼 모니터 출력

정상 작동 시 다음과 같은 로그가 표시됩니다:

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

## ⚙️ 카메라 설정 (선택사항)

### 프레임 레이트 조정

```cpp
const unsigned long FRAME_INTERVAL = 100; // 100ms = 10 FPS
```

### 해상도 및 품질

```cpp
config.frame_size = FRAMESIZE_VGA;  // VGA (640x480)
config.jpeg_quality = 10;           // 0-63, 낮을수록 고품질
```

## 📊 해상도 옵션

코드에서 사용 가능한 해상도:

| 해상도           | 크기      | 설명                   |
| ---------------- | --------- | ---------------------- |
| `FRAMESIZE_QVGA` | 320x240   | 낮은 해상도, 빠른 전송 |
| `FRAMESIZE_CIF`  | 400x296   | -                      |
| `FRAMESIZE_VGA`  | 640x480   | 권장 (균형)            |
| `FRAMESIZE_SVGA` | 800x600   | 중간 해상도            |
| `FRAMESIZE_XGA`  | 1024x768  | 높은 해상도            |
| `FRAMESIZE_SXGA` | 1280x1024 | -                      |
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

### PlatformIO 관련 문제

#### 포트를 찾을 수 없음

```bash
# 사용 가능한 포트 확인
pio device list

# 특정 포트로 업로드
pio run --target upload --upload-port /dev/ttyUSB0
```

#### 의존성 문제

```bash
# 라이브러리 재설치
pio lib install

# 빌드 캐시 정리
pio run --target clean
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

## 📁 프로젝트 구조

```
esp32-camera-firmware/
├── platformio.ini              # PlatformIO 설정
├── src/
│   ├── main.cpp               # 메인 소스 코드 (PlatformIO)
│   ├── CameraModule.h         # 카메라 모듈 인터페이스
│   ├── CameraModule.cpp       # 카메라 초기화/캡처 구현
│   ├── LedModule.h            # LED 제어 인터페이스
│   └── LedModule.cpp          # LED 제어 구현
├── include/                   # 헤더 파일 (선택사항)
├── lib/                       # 커스텀 라이브러리 (선택사항)
├── ESP32_Camera_Stream/       # Arduino IDE용
│   ├── ESP32_Camera_Stream.ino  # Arduino 메인 스케치
│   ├── CameraModule.h         # 카메라 모듈 인터페이스
│   ├── CameraModule.cpp       # 카메라 초기화/캡처 구현
│   ├── LedModule.h            # LED 제어 인터페이스
│   └── LedModule.cpp          # LED 제어 구현
└── README.md
```

### 모듈 설명

펌웨어는 기능별로 모듈화된 구조를 사용합니다:

**CameraModule**

- ESP32-CAM의 카메라 초기화 및 설정
- 프레임 캡처 및 메모리 관리
- PSRAM 감지 및 센서 최적화
- JPEG 품질 및 해상도 설정

**LedModule**

- ESP32-CAM의 내장 LED(플래시) 제어
- LED ON/OFF/Toggle 기능
- LED 상태 추적 및 조회

## 📚 추가 리소스

- [PlatformIO 문서](https://docs.platformio.org/)
- [ESP32-CAM 공식 문서](https://github.com/espressif/esp32-camera)
- [Arduino ESP32 가이드](https://docs.espressif.com/projects/arduino-esp32/)
- [WebSockets 라이브러리](https://github.com/Links2004/arduinoWebSockets)

## 📝 라이선스

Copyright (C) 2026 Granule Co Ltd. - All Rights Reserved.

## 👨‍💻 작성자

**Sim Si-Geun** <sim@granule.io>

**날짜**: 2026-02-17 (PlatformIO 지원 추가)
