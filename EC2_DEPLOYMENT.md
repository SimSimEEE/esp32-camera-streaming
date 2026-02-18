# EC2 배포 가이드 (52.79.241.244)

## 🚀 빠른 배포

### 방법 1: SSH 키가 있는 경우

```bash
# SSH 키 경로 지정
export SSH_KEY=~/.ssh/your-ec2-key.pem
chmod 400 $SSH_KEY

# 배포 실행
./deploy-ec2.sh
```

### 방법 2: SSH 키가 없는 경우

**SSH 키 찾기**:

```bash
# 일반적인 위치에서 키 찾기
find ~ -name "*.pem" -type f 2>/dev/null | grep -E "aws|ec2"
```

**SSH 키 다운로드** (AWS Console):

1. AWS Console → EC2 → Key Pairs
2. 기존 키 확인 또는 새 키 생성
3. 키 파일 다운로드 → `~/.ssh/` 폴더에 저장
4. 권한 설정: `chmod 400 ~/.ssh/your-key.pem`

### 방법 3: SSH Config 설정

`~/.ssh/config` 파일에 추가:

```
Host ec2-esp32
    HostName 52.79.241.244
    User ec2-user
    IdentityFile ~/.ssh/your-ec2-key.pem
```

그 다음:

```bash
# config 설정 후에는 키 지정 없이 실행 가능
./deploy-ec2.sh
```

---

## 📋 배포 옵션

스크립트 실행 시 선택 가능:

1. **Docker 이미지 배포** (빠름, 추천)
    - 로컬에서 빌드된 Docker 이미지를 EC2로 전송
    - 빠르고 안정적

2. **Git Pull + 빌드 배포** (느림)
    - EC2에서 직접 Git Pull 후 빌드
    - 소스 동기화 필요 시 사용

3. **상태 확인만**
    - 현재 서버 상태 확인
    - 로그 확인

---

## 🔧 수동 배포 (SSH 키가 있는 경우)

### 서버 배포

```bash
# SSH 접속
ssh -i ~/.ssh/your-key.pem ec2-user@52.79.241.244

# 프로젝트 디렉토리 이동
cd /home/ec2-user/esp32-camera-streaming

# Git Pull
git pull origin master

# Docker 빌드 및 실행
cd esp32-camera-server
docker build -t esp32-camera-server:latest .

# 기존 컨테이너 중지
docker stop esp32-camera-server || true
docker rm esp32-camera-server || true

# 새 컨테이너 실행
docker run -d \
    --name esp32-camera-server \
    --restart unless-stopped \
    -p 80:8887 \
    -p 8887:8887 \
    esp32-camera-server:latest

# 상태 확인
docker ps | grep esp32-camera-server
docker logs -f esp32-camera-server
```

### 클라이언트 배포 (Nginx)

```bash
# SSH 접속
ssh -i ~/.ssh/your-key.pem ec2-user@52.79.241.244

# 클라이언트 파일 동기화
cd /home/ec2-user/esp32-camera-streaming/esp32-camera-client
git pull origin master

# Nginx 설정 (이미 설정되어 있으면 생략)
sudo cp nginx.conf /etc/nginx/conf.d/esp32-camera.conf
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🌐 접속 확인

배포 완료 후:

- **서버**: http://52.79.241.244:8887
- **웹 클라이언트**: http://52.79.241.244

---

## 🔍 트러블슈팅

### SSH 연결 실패

**원인**: SSH 키 권한 또는 경로 문제

**해결**:

```bash
# 키 권한 확인
ls -l ~/.ssh/*.pem

# 권한 수정
chmod 400 ~/.ssh/your-key.pem

# 연결 테스트
ssh -i ~/.ssh/your-key.pem ec2-user@52.79.241.244 "echo OK"
```

### Docker 빌드 실패

**원인**: EC2 메모리 부족

**해결**:

```bash
# 로컬에서 이미지 빌드 후 전송 (옵션 1 사용)
./deploy-ec2.sh
# → 옵션 1 선택 (Docker 이미지 배포)
```

### 포트 접근 불가

**원인**: EC2 보안 그룹 설정

**해결**:

1. AWS Console → EC2 → Security Groups
2. 인바운드 규칙 추가:
    - HTTP (80)
    - Custom TCP (8887)
    - 소스: 0.0.0.0/0 (또는 특정 IP)

---

## 📊 유용한 명령어

```bash
# 로그 확인
ssh -i ~/.ssh/your-key.pem ec2-user@52.79.241.244 \
    "docker logs -f esp32-camera-server"

# 컨테이너 재시작
ssh -i ~/.ssh/your-key.pem ec2-user@52.79.241.244 \
    "docker restart esp32-camera-server"

# 컨테이너 중지
ssh -i ~/.ssh/your-key.pem ec2-user@52.79.241.244 \
    "docker stop esp32-camera-server"

# 서버 상태 확인
ssh -i ~/.ssh/your-key.pem ec2-user@52.79.241.244 \
    "docker ps | grep esp32-camera-server"
```

---

## 🎯 다음 단계

1. **SSH 키 설정** (위 방법 참고)
2. **배포 실행**: `./deploy-ec2.sh`
3. **접속 확인**: http://52.79.241.244
4. **ESP32 설정**: Config.h에서 서버 URL을 `52.79.241.244`로 설정

---

**준비가 되면 실행하세요**:

```bash
./deploy-ec2.sh
```
