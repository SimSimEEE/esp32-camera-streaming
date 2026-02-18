# 🎯 Motion Detection Quick Start Guide

ESP32 카메라 스트리밍에 AI 기반 모션 감지 기능이 추가되었습니다!

## ✨ 주요 기능

- **실시간 화면 변화 감지**: OpenCV로 프레임 간 변화를 분석
- **AI 기반 이유 탐지**: 변화의 원인을 자동으로 분석 (사람, 물체, 조명, 카메라 흔들림)
- **자동 스냅샷**: 모션 감지 시 자동으로 이미지 저장
- **실시간 알림**: 웹 UI에 실시간 모션 이벤트 표시

## 🚀 빠른 시작

### 1단계: 전체 시스템 실행

```bash
# 프로젝트 루트에서 실행
./start-with-motion-detection.sh
```

이 스크립트는 자동으로:
- Java 카메라 서버 빌드 & 실행
- Python 모션 감지 서비스 빌드 & 실행
- 네트워크 설정 및 볼륨 마운트

### 2단계: OpenAI API 설정 (선택사항)

더 정확한 AI 분석을 원하면:

```bash
# .env 파일 생성
cd esp32-motion-detector
cp .env.example .env

# .env 파일 편집하여 API 키 추가
OPENAI_API_KEY=sk-your-api-key-here
```

API 키가 없으면 자동으로 로컬 휴리스틱 분석으로 전환됩니다.

### 3단계: ESP32 연결

ESP32 펌웨어를 업로드하고 서버에 연결합니다:

```bash
cd esp32-camera-firmware
npm run upload
```

### 4단계: 웹 클라이언트 열기

브라우저에서 클라이언트를 열고 모션 알림을 확인합니다.

## 📊 모니터링

### 로그 확인

```bash
# 전체 로그
docker-compose -f docker-compose-full.yml logs -f

# 모션 감지 로그만
docker-compose -f docker-compose-full.yml logs -f motion-detector
```

### 스냅샷 확인

```bash
# 저장된 스냅샷 목록
ls -lh esp32-motion-detector/snapshots/

# 최근 스냅샷 보기
open esp32-motion-detector/snapshots/
```

### 서비스 상태

```bash
# 실행 중인 서비스 확인
docker-compose -f docker-compose-full.yml ps

# 서비스 재시작
docker-compose -f docker-compose-full.yml restart motion-detector
```

## ⚙️ 설정 조정

### 모션 감지 민감도 조정

`docker-compose-full.yml` 파일에서:

```yaml
environment:
  - MOTION_THRESHOLD=0.1    # 낮을수록 더 민감 (0.05 ~ 0.2)
  - MIN_CONTOUR_AREA=500    # 최소 감지 영역 크기
```

### AI 분석 빈도 조정

```yaml
environment:
  - AI_COOLDOWN=3           # AI 분석 간 대기 시간 (초)
  - ENABLE_AI=true          # AI 분석 활성화/비활성화
```

### 스냅샷 설정

```yaml
environment:
  - SAVE_SNAPSHOTS=true     # 스냅샷 저장 활성화
  - SNAPSHOT_DIR=/app/snapshots
```

## 🎨 웹 UI에 모션 알림 추가

클라이언트 코드에 `MotionAlerts` 컴포넌트를 추가하세요:

```tsx
import MotionAlerts from './components/MotionAlerts';

function App() {
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);
  
  return (
    <div>
      <CameraViewer websocket={websocket} />
      <MotionAlerts websocket={websocket} maxEvents={10} />
    </div>
  );
}
```

## 📈 모션 레벨 의미

| 레벨 | 변화율 | 의미 | 예시 |
|------|--------|------|------|
| 🟢 **None** | < 0.5% | 거의 변화 없음 | 정적인 장면 |
| 🔵 **Low** | 0.5% ~ 2% | 미세한 변화 | 조명 변화, 그림자 |
| 🟡 **Medium** | 2% ~ 5% | 중간 변화 | 작은 물체 이동 |
| 🟠 **High** | 5% ~ 10% | 큰 변화 | 사람 등장, 큰 물체 이동 |
| 🔴 **Critical** | > 10% | 매우 큰 변화 | 카메라 이동, 전체 장면 변화 |

## 🔍 변화 유형 분류

AI가 다음과 같은 변화를 감지합니다:

- 👤 **Person**: 사람 형태 감지
- 📦 **Object**: 물체 이동
- 💡 **Light**: 조명 변화
- 📹 **Camera**: 카메라 흔들림
- ❓ **Unknown**: 분류 불가

## 🛠️ 트러블슈팅

### 모션이 감지되지 않을 때

1. **임계값 낮추기**:
   ```yaml
   MOTION_THRESHOLD=0.05
   ```

2. **최소 영역 크기 줄이기**:
   ```yaml
   MIN_CONTOUR_AREA=300
   ```

### AI 분석이 작동하지 않을 때

1. **API 키 확인**:
   ```bash
   echo $OPENAI_API_KEY
   ```

2. **로컬 분석으로 전환**:
   ```yaml
   ENABLE_AI=false
   ```

### 스냅샷이 저장되지 않을 때

1. **권한 확인**:
   ```bash
   chmod 777 esp32-motion-detector/snapshots/
   ```

2. **디스크 공간 확인**:
   ```bash
   df -h
   ```

## 🎯 성능 최적화

### 메모리 사용량 줄이기

```yaml
environment:
  - BLUR_SIZE=11            # 기본값: 21
  - SAVE_SNAPSHOTS=false    # 스냅샷 비활성화
```

### CPU 사용량 줄이기

```yaml
environment:
  - AI_COOLDOWN=10          # AI 분석 빈도 감소
  - ENABLE_AI=false         # AI 완전 비활성화
```

## 📞 도움말

- **전체 문서**: [esp32-motion-detector/README.md](esp32-motion-detector/README.md)
- **서버 문서**: [esp32-camera-server/README.md](esp32-camera-server/README.md)
- **클라이언트 문서**: [esp32-camera-client/README.md](esp32-camera-client/README.md)

---

**Happy Motion Detecting! 🎯**
