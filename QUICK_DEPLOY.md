# 🚀 빠른 배포 가이드

## 한 번에 배포하기

### 전제 조건

1. **AWS CLI 설정**

```bash
aws configure
# AWS Access Key ID: YOUR_KEY
# AWS Secret Access Key: YOUR_SECRET
# Default region: ap-northeast-2
```

2. **Docker 실행 중**

```bash
docker ps  # Docker가 실행 중인지 확인
```

---

## 방법 1: 자동 배포 스크립트 (권장) ⚡

### 1단계: 전체 배포 실행

```bash
cd ~/Documents/lemon/esp32-camera-streaming
chmod +x deploy-production.sh
./deploy-production.sh
```

이 스크립트는 자동으로:

- ✅ 서버 Docker 이미지 빌드
- ✅ AWS ECR에 이미지 푸시
- ✅ S3 버킷 생성 및 클라이언트 업로드

### 2단계: App Runner 배포

스크립트 실행 후 출력되는 ECR 이미지 URI를 복사하고:

1. [AWS App Runner Console](https://ap-northeast-2.console.aws.amazon.com/apprunner/home?region=ap-northeast-2#/services) 이동
2. **Create service** 클릭
3. 설정:
    - **Source**: Container registry → Amazon ECR
    - **Image URI**: `복사한 ECR URI`
    - **Port**: `8887`
    - **CPU/Memory**: 1 vCPU, 2 GB
4. **Create & deploy** 클릭

### 3단계: 클라이언트 설정 업데이트

App Runner 배포 완료 후 서비스 URL 복사 (예: `https://abc123.ap-northeast-2.awsapprunner.com`)

```bash
cd esp32-camera-client
# config.js 수정
```

[config.js](esp32-camera-client/config.js) 파일에서:

```javascript
production: {
    wsUrl: "wss://abc123.ap-northeast-2.awsapprunner.com/viewer",
    esp32Endpoint: "wss://abc123.ap-northeast-2.awsapprunner.com/esp32",
},
```

### 4단계: 클라이언트 재배포

```bash
cd esp32-camera-client
npm run deploy
```

### 5단계: 접속 확인

```
http://esp32-camera-viewer.s3-website-ap-northeast-2.amazonaws.com
```

---

## 방법 2: 수동 배포 (단계별) 🔧

### A. 서버 배포

```bash
# 1. 서버 빌드
cd esp32-camera-server
npm run build

# 2. ECR 리포지토리 생성
npm run ecr:create

# 3. ECR에 푸시
npm run push
```

출력된 이미지 URI를 AWS App Runner에서 사용하세요.

### B. 클라이언트 배포

```bash
# 1. S3 버킷 생성
aws s3 mb s3://esp32-camera-viewer --region ap-northeast-2

# 2. 웹 호스팅 활성화
aws s3 website s3://esp32-camera-viewer --index-document index.html

# 3. 버킷 정책 설정 (공개)
cat > bucket-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::esp32-camera-viewer/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket esp32-camera-viewer --policy file://bucket-policy.json

# 4. 클라이언트 업로드
cd esp32-camera-client
npm run deploy
```

---

## 배포 후 확인 사항 ✅

### 서버 상태 확인

```bash
# ECR 이미지 확인
aws ecr list-images --repository-name esp32-camera-server --region ap-northeast-2

# App Runner 서비스 확인 (배포 후)
# AWS Console에서 확인
```

### 클라이언트 상태 확인

```bash
# S3 파일 확인
aws s3 ls s3://esp32-camera-viewer/

# 브라우저에서 테스트
# http://esp32-camera-viewer.s3-website-ap-northeast-2.amazonaws.com
```

---

## 비용 예상 💰

| 서비스              | 인프라                       | 월 비용     |
| ------------------- | ---------------------------- | ----------- |
| Camera Server       | AWS App Runner (1 vCPU, 2GB) | ~$15        |
| Web Client          | S3 + 트래픽                  | ~$2         |
| ECR (Docker 이미지) | 1GB 저장                     | ~$0.10      |
| **총계**            |                              | **~$17/월** |

---

## 문제 해결 🔧

### AWS CLI 오류

```bash
# AWS CLI 설치 확인
aws --version

# AWS 설정 확인
aws sts get-caller-identity
```

### Docker 오류

```bash
# Docker 실행 확인
docker ps

# Docker 이미지 확인
docker images | grep esp32
```

### S3 업로드 오류

```bash
# 권한 확인
aws s3 ls

# 버킷 정책 확인
aws s3api get-bucket-policy --bucket esp32-camera-viewer
```

---

## ESP32 펌웨어 업데이트

App Runner 배포 후 ESP32 펌웨어도 업데이트해야 합니다:

```cpp
// esp32-camera-firmware/src/main.cpp

const char* WS_HOST = "abc123.ap-northeast-2.awsapprunner.com";
const int WS_PORT = 443;  // WSS
const char* WS_PATH = "/esp32";
```

펌웨어 업로드:

```bash
cd esp32-camera-firmware
pio run -t upload
```

---

## 다음 단계 📚

- CloudFront CDN 추가 (선택사항): [DEPLOYMENT.md](DEPLOYMENT.md) 참고
- 커스텀 도메인 설정
- HTTPS/WSS 인증서 설정
- 모니터링 및 로그 설정

---

## 도움말

자세한 내용은 [DEPLOYMENT.md](DEPLOYMENT.md)를 참고하세요.
