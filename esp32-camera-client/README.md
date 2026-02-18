# ESP32-CAM Real-time Streaming Client

> Portfolio Edition - Modern React + TypeScript + Tailwind CSS

ESP32-CAM 실시간 영상 스트리밍 클라이언트 - WebSocket 기반 포트폴리오 에디션

## 🎯 Features

- ✨ **Real-time Video Streaming**: WebSocket을 통한 ESP32-CAM 실시간 영상 스트림
- 🎨 **Modern UI**: React + TypeScript + Tailwind CSS 포트폴리오 스타일 디자인
- 📊 **Performance Metrics**: FPS, 해상도, 데이터 사용량 실시간 모니터링
- 🎛️ **Hardware Control**: LED ON/OFF 원격 제어
- 📈 **Live Charts**: Recharts를 활용한 FPS 실시간 그래프
- 🔄 **Auto Reconnect**: 연결 끊김 시 자동 재연결 (3초 간격)
- 👥 **Viewer Count**: 실시간 시청자 수 표시
- ℹ️ **Version Info**: Client, Server, Firmware 버전 정보 동기화

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7.3.1
- **Styling**: Tailwind CSS 3.4.19
- **Charts**: Recharts 3.7.0
- **Icons**: Lucide React 0.574.0
- **WebSocket**: Native WebSocket API (ws://52.79.241.244/ws/viewer)

## 📦 Installation

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 🚀 WebSocket Protocol

### Connection
- **URL**: `ws://52.79.241.244/ws/viewer`
- **Binary Type**: `arraybuffer`

### Messages

#### 수신 메시지 (Server → Client)

1. **Binary (ArrayBuffer)**: JPEG 이미지 프레임
2. **Text Messages**:
   - `VIEWERS_COUNT:숫자` - 시청자 수 업데이트
   - `VERSION_INFO:server:1.2.0,firmware:1.0.0` - 버전 정보
   - `LED_ON` / `LED_OFF` - LED 상태 동기화
   - `LED_STATUS:ON` / `LED_STATUS:OFF` - 현재 LED 상태

#### 송신 메시지 (Client → Server)

- `LED_ON` - LED 켜기
- `LED_OFF` - LED 끄기
- `LED_STATUS` - 현재 LED 상태 요청

## 📁 Project Structure

```
esp32-camera-client/
├── src/
│   ├── components/
│   │   └── CameraViewer.tsx    # 메인 카메라 뷰어 컴포넌트
│   ├── App.tsx                 # 앱 엔트리 포인트
│   ├── main.tsx                # React 진입점
│   └── index.css               # 글로벌 스타일
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🎨 Key Features Detail

### 1. Real-time Video Stream
- Canvas 기반 영상 렌더링
- ArrayBuffer → Blob → Image → Canvas 파이프라인
- 메모리 누수 방지 (URL.revokeObjectURL)

### 2. FPS Counter
- 1초마다 FPS 계산 및 업데이트
- 최근 20개 데이터 포인트 유지
- Recharts를 활용한 실시간 그래프 시각화

### 3. Hardware Control
- WebSocket을 통한 LED 제어
- 연결 상태에 따른 버튼 활성화/비활성화
- 다른 사용자의 제어 명령 실시간 동기화

### 4. Auto Reconnect
- 연결 끊김 감지
- 3초 후 자동 재연결 시도
- 무한 재시도 (setTimeout recursive)

## 🔧 Configuration

### WebSocket URL 변경

[src/components/CameraViewer.tsx](src/components/CameraViewer.tsx#L43)에서 수정:

```typescript
const WS_URL = 'ws://your-server-ip/ws/viewer';
```

## 📊 Performance

- **Bundle Size**: ~548 KB (gzip: ~168 KB)
- **FPS**: 30 fps (ESP32-CAM 기준)
- **Latency**: ~45ms (네트워크 상태에 따라 변동)
- **Resolution**: 자동 감지 (ESP32-CAM 설정에 따름)

## 🚀 Deployment

### Vercel 배포

```bash
npm install -g vercel
vercel --prod
```

### Nginx 설정 (서버 측)

```nginx
location /ws/ {
    proxy_pass http://localhost:8887/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
}
```

## 📜 Version History

- **v1.2.0** (2026-02-18): 포트폴리오 에디션 출시
  - React + TypeScript + Tailwind CSS로 완전 재작성
  - 현대적인 UI/UX 적용
  - FPS 실시간 그래프 추가
  - Auto reconnect 기능 추가

- **v1.1.1** (2026-02-17): Legacy 버전
  - Vanilla JavaScript 기반
  - 기본 WebSocket 기능 구현

## 📝 License

Copyright (C) 2026 Granule Co Ltd. - All Rights Reserved.

## 👨‍💻 Author

**Sim Si-Myeong** (SimSimEEE)
- Email: sim@granule.io
- GitHub: [@SimSimEEE](https://github.com/SimSimEEE)

---

**Portfolio Project** | ESP32-CAM Real-time Streaming

