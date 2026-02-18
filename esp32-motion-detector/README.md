# ESP32 Motion Detection Service

OpenCV 기반 실시간 화면 변화 감지 및 AI 분석 서비스

## 🎯 주요 기능

- **실시간 모션 감지**: OpenCV를 사용한 프레임 간 변화 감지
- **AI 기반 분석**: OpenAI Vision API 또는 로컬 휴리스틱으로 변화 이유 탐지
- **자동 스냅샷**: 모션 감지 시 자동으로 이미지 저장
- **WebSocket 통합**: ESP32 카메라 서버와 실시간 연동

## 🏗️ 아키텍처

```
ESP32 Camera → Java Server → Motion Detector → AI Analyzer
                    ↓              ↓                ↓
               WebSocket      OpenCV          OpenAI/Local
                              Detection        Analysis
```

## 📦 설치 & 실행

### 로컬 실행

```bash
# 1. 의존성 설치
pip install -r requirements.txt

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 설정

# 3. 실행
python src/main.py
```

### Docker 실행

```bash
# 1. 이미지 빌드
docker build -t esp32-motion-detector:latest .

# 2. Docker Compose로 실행
docker-compose up -d

# 3. 로그 확인
docker-compose logs -f motion-detector
```

## ⚙️ 설정

### 환경 변수

| 변수 | 설명 | 기본값 |
|------|------|--------|
| `WEBSOCKET_SERVER` | WebSocket 서버 URL | `ws://localhost:8887` |
| `OPENAI_API_KEY` | OpenAI API 키 (선택) | - |
| `ENABLE_AI` | AI 분석 활성화 | `true` |
| `AI_COOLDOWN` | AI 분석 쿨다운 (초) | `3` |
| `MOTION_THRESHOLD` | 모션 감지 임계값 | `0.1` |
| `BLUR_SIZE` | 가우시안 블러 크기 | `21` |
| `MIN_CONTOUR_AREA` | 최소 윤곽선 영역 | `500` |
| `SAVE_SNAPSHOTS` | 스냅샷 저장 활성화 | `true` |
| `SNAPSHOT_DIR` | 스냅샷 저장 경로 | `./snapshots` |

### 모션 레벨 분류

| 레벨 | 변화율 | 설명 |
|------|--------|------|
| `none` | < 0.5% | 변화 없음 |
| `low` | 0.5% ~ 2% | 낮은 변화 |
| `medium` | 2% ~ 5% | 중간 변화 |
| `high` | 5% ~ 10% | 높은 변화 |
| `critical` | > 10% | 심각한 변화 |

## 🤖 AI 분석

### OpenAI Vision API 사용

```bash
# .env 파일에 API 키 추가
OPENAI_API_KEY=sk-your-api-key-here
ENABLE_AI=true
```

AI는 다음을 감지합니다:
- 👤 사람 감지
- 📦 물체 이동
- 💡 조명 변화
- 📹 카메라 흔들림

### 로컬 휴리스틱 사용

API 키가 없으면 자동으로 로컬 이미지 처리 기반 분석으로 전환됩니다.

## 📊 모니터링

### 로그 확인

```bash
# Docker 로그
docker-compose logs -f motion-detector

# 파일 로그
tail -f logs/motion_detector.log
```

### 통계 확인

```bash
# 서비스 통계
npm run stats
```

### 스냅샷 확인

```bash
# 저장된 스냅샷 목록
npm run snapshot:view

# 스냅샷 위치
ls -lh snapshots/
```

## 🔌 Java 서버 통합

ESP32 Camera Server와 통합하려면:

1. **네트워크 생성**
   ```bash
   docker network create camera-network
   ```

2. **서버 실행** (camera-network에 연결)
   ```bash
   cd ../esp32-camera-server
   docker run --network camera-network --name esp32-camera-server ...
   ```

3. **Motion Detector 실행**
   ```bash
   docker-compose up -d
   ```

## 📝 메시지 포맷

### 서버로 전송하는 메시지

```json
{
  "type": "motion_event",
  "data": {
    "frame_number": 1234,
    "motion_level": "high",
    "change_percentage": 7.5,
    "change_type": "person",
    "description": "사람 형태 감지",
    "confidence": 0.85,
    "timestamp": "2026-02-19T10:30:00"
  },
  "timestamp": "2026-02-19T10:30:00"
}
```

### 서버로부터 수신하는 메시지

```json
{
  "type": "config",
  "data": {
    "threshold": 0.15,
    "enable_ai": false
  },
  "timestamp": "2026-02-19T10:30:00"
}
```

## 🛠️ 개발

### 프로젝트 구조

```
esp32-motion-detector/
├── src/
│   ├── types.py              # Type definitions
│   ├── motion_detector.py    # OpenCV motion detection
│   ├── ai_analyzer.py        # AI-based analysis
│   ├── websocket_client.py   # WebSocket client
│   └── main.py              # Entry point
├── tests/
│   └── test_motion.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── package.json
└── README.md
```

### 코딩 규칙

- **Arrow Functions**: `const fn = () => {}` (Python: `fn = () -> None`)
- **File Headers**: All files must have author/date header
- **Namespace Logging**: Use colored namespace logs
- **Type Safety**: Types defined in `types.py` first
- **Error Handling**: Try-catch with proper logging

## 🔧 트러블슈팅

### 연결 실패

```bash
# 서버 상태 확인
docker ps | grep camera-server

# 네트워크 확인
docker network inspect camera-network
```

### OpenCV 에러

```bash
# 시스템 라이브러리 설치
apt-get install libgl1-mesa-glx libglib2.0-0
```

### 메모리 부족

```bash
# 스냅샷 정리
rm -rf snapshots/*.jpg

# Docker 메모리 제한 설정
docker-compose.yml에 memory: 512m 추가
```

## 📚 참고 자료

- [OpenCV Documentation](https://docs.opencv.org/)
- [OpenAI Vision API](https://platform.openai.com/docs/guides/vision)
- [WebSocket Client](https://websockets.readthedocs.io/)

## 📄 라이선스

Copyright (C) 2026 Granule Co Ltd. - All Rights Reserved.

---

**Author**: Sim Si-Geun <sim@granule.io>  
**Date**: 2026-02-19  
**Version**: 1.0.0
