## ✅ 배포 완료 상태

### 1. 서버 (Docker → ECR) ✅

- **ECR 이미지**: `540298831859.dkr.ecr.ap-northeast-2.amazonaws.com/esp32-camera-server:latest`
- **Digest**: `sha256:7943265e192249f54b3bbca8640724203d4f3e34c47ea4b1f4664a0d00d20f34`
- **상태**: ✅ 푸시 완료

### 2. 클라이언트 (S3) ✅

- **S3 버킷**: `esp32-camera-viewer`
- **파일**:
    - ✅ index.html
    - ✅ app.js
    - ✅ config.js
    - ✅ styles.css
    - ✅ nginx.conf
- **상태**: ✅ 업로드 완료

---

## 🔧 추가 작업 필요

### Step 1: S3 Public Access 설정 (AWS 콘솔)

1. [S3 콘솔](https://s3.console.aws.amazon.com/s3/buckets/esp32-camera-viewer?region=ap-northeast-2&tab=permissions)로 이동
2. **Permissions** 탭 클릭
3. **Block public access (bucket settings)** → **Edit** 클릭
4. 모든 체크박스 해제:
    - ❌ Block all public access
    - ❌ Block public access to buckets and objects granted through new access control lists (ACLs)
    - ❌ Block public access to buckets and objects granted through any access control lists (ACLs)
    - ❌ Block public access to buckets and objects granted through new public bucket or access point policies
    - ❌ Block public and cross-account access to buckets and objects through any public bucket or access point policies
5. **Save changes** 클릭
6. 확인 창에서 `confirm` 입력

### Step 2: S3 버킷 정책 설정

1. **Permissions** 탭에서 **Bucket policy** → **Edit** 클릭
2. 다음 정책 입력:

```json
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
```

3. **Save changes** 클릭

### Step 3: App Runner 서버 배포

1. [AWS App Runner 콘솔](https://ap-northeast-2.console.aws.amazon.com/apprunner/home?region=ap-northeast-2#/services) 이동
2. **Create service** 클릭
3. **Source** 설정:
    - **Repository type**: Container registry
    - **Provider**: Amazon ECR
    - **Container image URI**: `540298831859.dkr.ecr.ap-northeast-2.amazonaws.com/esp32-camera-server:latest`
    - **Deployment trigger**: Manual
4. **Service settings**:
    - **Service name**: `esp32-camera-server`
    - **Port**: `8887`
    - **CPU**: 1 vCPU
    - **Memory**: 2 GB
5. **Create & deploy** 클릭
6. 배포 완료 후 **Default domain** 복사 (예: `https://abc123.ap-northeast-2.awsapprunner.com`)

### Step 4: 클라이언트 config.js 업데이트

App Runner URL을 복사한 후:

```bash
cd /Users/sim-ugeun/Documents/lemon/esp32-camera-streaming/esp32-camera-client
# config.js 파일 수정
```

[config.js](esp32-camera-client/config.js) 파일에서 **production** 섹션 수정:

```javascript
production: {
    wsUrl: "wss://YOUR_APP_RUNNER_URL/viewer",
    esp32Endpoint: "wss://YOUR_APP_RUNNER_URL/esp32",
},
```

예시:

```javascript
production: {
    wsUrl: "wss://abc123.ap-northeast-2.awsapprunner.com/viewer",
    esp32Endpoint: "wss://abc123.ap-northeast-2.awsapprunner.com/esp32",
},
```

### Step 5: 클라이언트 재배포

```bash
cd /Users/sim-ugeun/Documents/lemon/esp32-camera-streaming/esp32-camera-client
npm run deploy
```

---

## 🌐 접속 주소

### 웹 클라이언트

```
http://esp32-camera-viewer.s3-website-ap-northeast-2.amazonaws.com
```

### WebSocket 서버 (App Runner 배포 후)

```
wss://YOUR_APP_RUNNER_URL/viewer
```

### ESP32 연결 주소 (App Runner 배포 후)

```
wss://YOUR_APP_RUNNER_URL/esp32
```

---

## 📊 배포 비용 예상

| 서비스        | 인프라                       | 월 비용     |
| ------------- | ---------------------------- | ----------- |
| Camera Server | AWS App Runner (1 vCPU, 2GB) | ~$15        |
| Web Client    | S3 (정적 호스팅 + 트래픽)    | ~$2         |
| ECR           | Docker 이미지 저장 (1GB)     | ~$0.10      |
| **총계**      |                              | **~$17/월** |

---

## ✅ 배포 확인

### 1. S3 파일 확인

```bash
aws s3 ls s3://esp32-camera-viewer/
```

### 2. ECR 이미지 확인

```bash
aws ecr describe-images --repository-name esp32-camera-server --region ap-northeast-2
```

### 3. 웹 접속 테스트

브라우저에서 S3 웹사이트 URL 접속:

```
http://esp32-camera-viewer.s3-website-ap-northeast-2.amazonaws.com
```

### 4. App Runner 서비스 상태 확인

AWS Console → App Runner → Services

---

## 🔧 문제 해결

### S3 403 Forbidden

- Public Access Block 설정 확인
- Bucket Policy 설정 확인

### App Runner 배포 실패

- ECR 이미지 URI 확인
- Port 8887 설정 확인

### WebSocket 연결 실패

- App Runner URL이 wss://로 시작하는지 확인
- config.js에 올바른 URL이 입력되었는지 확인

---

## 📚 다음 단계

1. **CloudFront CDN 추가** (선택사항)
    - 전 세계 빠른 접속 속도
    - HTTPS 자동 지원
    - [DEPLOYMENT.md](DEPLOYMENT.md) 참고

2. **커스텀 도메인 설정**
    - Route 53으로 도메인 연결
    - SSL 인증서 설정

3. **모니터링 설정**
    - CloudWatch Logs 확인
    - App Runner 메트릭 모니터링

---

## 📞 도움말

- [QUICK_DEPLOY.md](QUICK_DEPLOY.md) - 빠른 배포 가이드
- [DEPLOYMENT.md](DEPLOYMENT.md) - 상세 배포 가이드
- [README.md](README.md) - 프로젝트 개요
