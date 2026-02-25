# ESP32 짐벌 제어 시스템 - 프로젝트 개요

> **ESP32 기반 실시간 원격 짐벌 제어 및 임베디드 시스템 모니터링 대시보드**
>
> @author Sim Woo-Keun <smileteeth14@gmail.com>  
> @date 2026-02-25 initial draft  
> @copyright (C) 2026 SimSimEEE - All Rights Reserved.

---

## 🎯 프로젝트 목표

ESP32-CAM을 활용하여 **실시간 영상 스트리밍**과 **2축 짐벌(Pan/Tilt) 제어**를 구현하되, 시스템의 내부 리소스를 실시간으로 모니터링하는 **엔지니어링 대시보드**를 구축합니다.

### 핵심 가치

1. **엔지니어링 중심의 시각화**: 단순한 제어를 넘어, 시스템 내부 상태를 실시간으로 파악
2. **정밀 제어**: PID 제어 알고리즘과 센서 융합으로 정확한 짐벌 제어 구현
3. **실시간 성능**: 저지연 통신과 효율적인 바이너리 프로토콜로 반응성 극대화
4. **디지털 트윈**: 실제 하드웨어의 상태를 3D로 시각화하여 직관적 모니터링

---

## 🏗️ 시스템 구성 요소

### 1️⃣ 임베디드 시스템 (ESP32 Firmware)

**하드웨어 구성**:
- **ESP32-CAM**: 메인 MCU + 카메라 모듈
- **MPU6050**: 6축 자이로/가속도 센서 (I2C)
- **서보 모터 x2**: Pan/Tilt 제어 (PWM)
- **INA219** (옵션): 전력 모니터링 센서

**핵심 기능**:
- ✅ FreeRTOS 멀티태스킹 (코어별 태스크 분산)
- ✅ 실시간 카메라 스트리밍 (MJPEG)
- ✅ MPU6050 센서 데이터 읽기 + 상보 필터
- ✅ PID 제어 기반 서보 모터 제어
- ✅ 시스템 텔레메트리 수집 및 전송
- ✅ 바이너리 WebSocket 통신

### 2️⃣ 웹 대시보드 (React Frontend)

**기술 스택**:
- React 18 + TypeScript
- Three.js (3D 디지털 트윈)
- Chart.js (실시간 차트)
- WebSocket (양방향 통신)
- TailwindCSS (UI 스타일링)

**핵심 기능**:
- ✅ 실시간 영상 스트리밍 뷰어
- ✅ Three.js 3D 짐벌 모델 (실시간 각도 동기화)
- ✅ 시스템 리소스 모니터링 패널
- ✅ 마우스/터치 기반 짐벌 제어
- ✅ 런타임 PID 튜닝 인터페이스
- ✅ 실시간 성능 차트 (지연시간, CPU, 메모리 등)

### 3️⃣ 통신 프로토콜

**이원화 설계**:
- **MJPEG Stream**: HTTP 기반 영상 스트리밍 (저지연)
- **WebSocket Binary**: 제어 명령 + 텔레메트리 (C struct 직렬화)

**데이터 흐름**:
```
[ESP32] ←WebSocket→ [Server/Browser]
   ↓ MJPEG
[Browser]
```

---

## 📊 주요 성능 지표

| 항목 | 목표 스펙 | 측정 방법 |
|------|-----------|-----------|
| **영상 지연** | < 200ms | 타임스탬프 비교 |
| **제어 응답** | < 50ms | WebSocket RTT |
| **각도 정확도** | ±1° | 목표 vs 실제 각도 차이 |
| **FPS** | 20~30 fps | 카메라 출력 |
| **CPU 사용률** | < 80% | FreeRTOS 통계 |
| **Heap 여유** | > 30KB | Free Heap Size |

---

## 🎓 기술적 도전 과제

### 1. **멀티태스킹 설계**
- **문제**: 카메라 스트리밍, 센서 읽기, 모터 제어를 동시에 처리
- **해결**: FreeRTOS 태스크를 Core 0/1에 분산 배치, 우선순위 설정

### 2. **센서 데이터 융합**
- **문제**: MPU6050의 노이즈와 드리프트
- **해결**: 상보 필터(Complementary Filter)로 자이로/가속도 융합

### 3. **저지연 통신**
- **문제**: JSON 직렬화 오버헤드
- **해결**: C struct 바이너리 직렬화로 패킷 크기 최소화

### 4. **PID 튜닝**
- **문제**: 하드웨어별 최적 PID 계수 상이
- **해결**: 런타임 튜닝 UI로 실시간 파라미터 조정

### 5. **3D 동기화**
- **문제**: Three.js 렌더링 타이밍과 센서 데이터 동기화
- **해결**: requestAnimationFrame + 타임스탬프 기반 보간

---

## 🚀 확장 가능성

### Phase 2 (미래 기능)
- [ ] **자동 추적**: 얼굴/물체 인식 후 자동 짐벌 추적
- [ ] **녹화 기능**: 서버 측 영상 녹화 및 저장
- [ ] **다중 카메라**: 여러 ESP32-CAM 동시 제어
- [ ] **AI 분석**: 실시간 객체 인식 결과 오버레이

### Phase 3 (고급 기능)
- [ ] **SLAM**: 3D 매핑 및 자율 탐색
- [ ] **클라우드 연동**: AWS IoT Core 통합
- [ ] **모바일 앱**: React Native 짐벌 컨트롤러

---

## 📁 프로젝트 구조

```
esp32-camera-streaming/
├── docs/
│   ├── GIMBAL_PROJECT_OVERVIEW.md        # 이 문서
│   ├── GIMBAL_ARCHITECTURE.md            # 시스템 아키텍처
│   ├── GIMBAL_PROTOCOL.md                # 통신 프로토콜 사양
│   └── GIMBAL_ROADMAP.md                 # 구현 로드맵
├── esp32-gimbal-firmware/                # ESP32 펌웨어 (신규)
│   ├── src/
│   │   ├── main.cpp
│   │   ├── tasks/                        # FreeRTOS 태스크
│   │   ├── sensors/                      # MPU6050, INA219
│   │   ├── control/                      # PID 제어
│   │   └── comm/                         # WebSocket 통신
│   └── platformio.ini
├── esp32-camera-client/                  # React 대시보드 (확장)
│   └── src/
│       ├── components/
│       │   ├── GimbalViewer3D.tsx        # Three.js 3D 뷰
│       │   ├── TelemetryPanel.tsx        # 시스템 모니터
│       │   ├── PIDTuner.tsx              # PID 튜닝 UI
│       │   └── PerformanceChart.tsx      # 실시간 차트
│       └── hooks/
│           └── useGimbalWebSocket.ts     # 바이너리 WebSocket
└── esp32-camera-server/                  # Java 서버 (확장)
    └── src/main/java/io/granule/camera/
        └── gimbal/
            ├── GimbalControlService.java
            └── TelemetryAggregator.java
```

---

## 🎯 성공 기준

✅ **Milestone 1**: ESP32에서 MPU6050 센서 데이터 읽기 + 서보 제어  
✅ **Milestone 2**: 바이너리 WebSocket 통신 구현  
✅ **Milestone 3**: Three.js 3D 짐벌 모델 실시간 동기화  
✅ **Milestone 4**: 시스템 텔레메트리 대시보드 완성  
✅ **Milestone 5**: PID 튜닝 및 성능 최적화  

---

## 📚 참고 자료

### ESP32 개발
- [ESP32 FreeRTOS Documentation](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/freertos.html)
- [MPU6050 Arduino Library](https://github.com/jrowberg/i2cdevlib/tree/master/Arduino/MPU6050)
- [ESP32-CAM Example](https://github.com/espressif/arduino-esp32/tree/master/libraries/ESP32/examples/Camera)

### 제어 이론
- [PID Control Wikipedia](https://en.wikipedia.org/wiki/PID_controller)
- [Complementary Filter Paper](https://www.nxp.com/docs/en/application-note/AN3461.pdf)

### 웹 개발
- [Three.js Documentation](https://threejs.org/docs/)
- [Chart.js Real-time Examples](https://www.chartjs.org/docs/latest/samples/advanced/linear-gradient.html)
- [WebSocket Binary Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers#exchanging_data_frames)

---

## 🤝 기여 가이드

이 프로젝트는 개인 포트폴리오 프로젝트이지만, 피드백과 제안은 언제나 환영합니다!

**Contact**: smileteeth14@gmail.com

---

**Last Updated**: 2026-02-25  
**Version**: 1.0.0-draft  
**Branch**: feature/gimbal-dashboard
