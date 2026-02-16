# ESP32 Camera Server

ESP32-CAM의 실시간 카메라 스트리밍을 위한 WebSocket 서버입니다. Granule Core를 dependency로 사용합니다.

## 🔧 요구사항

- Java 17 이상
- Maven 3.6 이상
- Granule Core 1.0.0

## 📦 설치

### 1. Granule Core 빌드 및 설치

먼저 Granule Core를 로컬 Maven 저장소에 설치합니다:

```bash
cd ../../granule-core
mvn clean install
```

### 2. 서버 프로젝트 빌드

```bash
cd ../esp32-camera-streaming/esp32-camera-server
mvn clean package
```

## 🚀 실행

### Maven을 통한 실행

```bash
mvn exec:java -Dexec.mainClass="io.lemoncloud.camera.server.CameraStreamServer"
```

다른 포트 사용 (기본값: 8887):

```bash
mvn exec:java -Dexec.mainClass="io.lemoncloud.camera.server.CameraStreamServer" -Dexec.args="9000"
```

### JAR 파일로 실행

```bash
java -jar target/esp32-camera-server-1.0.0.jar
```

포트 지정:

```bash
java -jar target/esp32-camera-server-1.0.0.jar 9000
```

## 🌐 엔드포인트

서버가 시작되면 다음 두 개의 WebSocket 엔드포인트가 열립니다:

- **ESP32 엔드포인트**: `ws://localhost:8887/esp32`
  - ESP32-CAM 장치가 연결하여 영상 데이터를 전송
  
- **Viewer 엔드포인트**: `ws://localhost:8887/viewer`
  - 웹 클라이언트가 연결하여 실시간 스트림을 수신

## 📊 작동 방식

```
ESP32-CAM  ──→  /esp32  ──→  Server  ──→  /viewer  ──→  Web Client
(영상 전송)                  (중계)                   (영상 수신)
```

1. ESP32-CAM이 `/esp32` 엔드포인트로 연결
2. JPEG 형식의 카메라 프레임을 바이너리 데이터로 전송
3. 서버가 모든 `/viewer` 연결된 클라이언트에게 프레임 브로드캐스트
4. 웹 클라이언트가 실시간으로 영상 표시

## 🔍 로그

서버는 다음 정보를 로그로 출력합니다:

- 클라이언트 연결/해제 이벤트
- 프레임 수신 및 전송 (DEBUG 레벨)
- 에러 및 예외 상황
- 현재 연결된 ESP32 및 웹 클라이언트 수

로그 레벨은 `src/main/resources/logback.xml`에서 조정할 수 있습니다.

## 🛠️ 개발

### 프로젝트 구조

```
esp32-camera-server/
├── pom.xml
├── src/
│   └── main/
│       ├── java/
│       │   └── io/lemoncloud/camera/server/
│       │       └── CameraStreamServer.java
│       └── resources/
│           └── logback.xml
└── README.md
```

### Granule Core 통합

이 프로젝트는 Granule Core를 Maven dependency로 사용합니다:

```xml
<dependency>
    <groupId>io.lemoncloud</groupId>
    <artifactId>granule-core</artifactId>
    <version>1.0.0</version>
</dependency>
```

## 📝 라이선스

Copyright (C) 2026 LemonCloud Co Ltd. - All Rights Reserved.
