#!/bin/bash
set -e

# ESP32 Camera Streaming - Full Stack Production Deployment
# Includes: Server + Motion Detector + Client
# Author: Sim Si-Geun
# Date: 2026-02-19

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

# 설정
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
ECR_REPO_SERVER="esp32-camera-server"
ECR_REPO_DETECTOR="esp32-motion-detector"
S3_BUCKET="${S3_BUCKET:-esp32-camera-viewer}"

# 함수 정의
print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_step() {
    echo -e "${GREEN}▶ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 배포 시작
print_header "ESP32 Camera Streaming - Full Stack Deployment"

# Step 1: AWS 계정 확인
print_step "Step 1: AWS 계정 확인..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query 'Account' 2>/dev/null || echo "")

if [ -z "$AWS_ACCOUNT_ID" ]; then
    print_error "AWS CLI가 설정되지 않았습니다."
    echo ""
    echo "AWS CLI 설정 방법:"
    echo "  aws configure"
    echo ""
    exit 1
fi

print_success "AWS Account ID: $AWS_ACCOUNT_ID"
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE_SERVER="${ECR_URL}/${ECR_REPO_SERVER}:latest"
FULL_IMAGE_DETECTOR="${ECR_URL}/${ECR_REPO_DETECTOR}:latest"

# Step 2: ECR 로그인
print_step "Step 2: ECR 로그인..."
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $ECR_URL > /dev/null 2>&1
print_success "ECR 로그인 완료"

# ==========================================
# Part 1: 서버 배포
# ==========================================

print_header "Part 1: Camera Server 배포"

cd "$SCRIPT_DIR/esp32-camera-server"

print_step "Step 3: 서버 빌드 (Maven)..."
mvn clean package -DskipTests -q || {
    print_error "Maven 빌드 실패"
    exit 1
}
print_success "Maven 빌드 완료"

print_step "Step 4: Docker 이미지 빌드..."
docker build -t esp32-camera-server:latest . || {
    print_error "Docker 빌드 실패"
    exit 1
}
print_success "Docker 이미지 빌드 완료"

print_step "Step 5: ECR 리포지토리 준비..."
if aws ecr describe-repositories --repository-names $ECR_REPO_SERVER --region $AWS_REGION > /dev/null 2>&1; then
    print_warning "리포지토리가 이미 존재합니다: $ECR_REPO_SERVER"
else
    print_warning "리포지토리 생성 중: $ECR_REPO_SERVER"
    aws ecr create-repository --repository-name $ECR_REPO_SERVER --region $AWS_REGION 2>&1 | grep -v "RepositoryAlreadyExistsException" || true
fi
print_success "ECR 리포지토리 준비 완료"

print_step "Step 6: 이미지 태깅 및 푸시..."
docker tag esp32-camera-server:latest $FULL_IMAGE_SERVER
echo "  Pushing to ECR (this may take a minute)..."
docker push $FULL_IMAGE_SERVER || {
    print_error "ECR 푸시 실패"
    exit 1
}
print_success "서버 이미지 ECR 푸시 완료"

echo ""
print_success "Server Image URI: $FULL_IMAGE_SERVER"

# ==========================================
# Part 2: Motion Detector 배포
# ==========================================

print_header "Part 2: Motion Detector 배포"

cd "$SCRIPT_DIR/esp32-motion-detector"

print_step "Step 7: Motion Detector Docker 이미지 빌드..."
docker build -t esp32-motion-detector:latest . || {
    print_error "Docker 빌드 실패"
    exit 1
}
print_success "Docker 이미지 빌드 완료"

print_step "Step 8: ECR 리포지토리 준비..."
if aws ecr describe-repositories --repository-names $ECR_REPO_DETECTOR --region $AWS_REGION > /dev/null 2>&1; then
    print_warning "리포지토리가 이미 존재합니다: $ECR_REPO_DETECTOR"
else
    print_warning "리포지토리 생성 중: $ECR_REPO_DETECTOR"
    aws ecr create-repository --repository-name $ECR_REPO_DETECTOR --region $AWS_REGION 2>&1 | grep -v "RepositoryAlreadyExistsException" || true
fi
print_success "ECR 리포지토리 준비 완료"

print_step "Step 9: 이미지 태깅 및 푸시..."
docker tag esp32-motion-detector:latest $FULL_IMAGE_DETECTOR
echo "  Pushing to ECR (this may take a minute)..."
docker push $FULL_IMAGE_DETECTOR || {
    print_error "ECR 푸시 실패"
    exit 1
}
print_success "Motion Detector 이미지 ECR 푸시 완료"

echo ""
print_success "Motion Detector Image URI: $FULL_IMAGE_DETECTOR"

# ==========================================
# Part 3: 클라이언트 배포
# ==========================================

print_header "Part 3: Web Client 배포"

cd "$SCRIPT_DIR/esp32-camera-client"

print_step "Step 10: S3 버킷 준비..."
aws s3 ls s3://$S3_BUCKET 2>/dev/null || {
    print_warning "S3 버킷 생성 중..."
    aws s3 mb s3://$S3_BUCKET --region $AWS_REGION
    
    # 정적 웹 호스팅 활성화
    aws s3 website s3://$S3_BUCKET --index-document index.html
    
    # 퍼블릭 액세스 차단 해제
    aws s3api put-public-access-block \
        --bucket $S3_BUCKET \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    # 버킷 정책 설정
    cat > /tmp/bucket-policy.json << 'JSON'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::$S3_BUCKET/*"
        }
    ]
}
JSON
    sed -i '' "s/\$S3_BUCKET/$S3_BUCKET/g" /tmp/bucket-policy.json
    aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file:///tmp/bucket-policy.json
    rm /tmp/bucket-policy.json
}
print_success "S3 버킷 준비 완료"

print_step "Step 11: 클라이언트 의존성 설치..."
if [ ! -d "node_modules" ]; then
    npm install || {
        print_error "의존성 설치 실패"
        exit 1
    }
fi
print_success "의존성 설치 완료"

print_step "Step 12: 클라이언트 빌드..."
npm run build || {
    print_error "클라이언트 빌드 실패"
    exit 1
}
print_success "클라이언트 빌드 완료"

print_step "Step 13: S3에 업로드..."
aws s3 sync dist/ s3://$S3_BUCKET --delete
print_success "S3 업로드 완료"

# ==========================================
# 배포 완료
# ==========================================

cd "$SCRIPT_DIR"

print_header "🎉 배포 완료!"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}배포된 리소스:${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📦 ECR Images:"
echo "  ● Server:   $FULL_IMAGE_SERVER"
echo "  ● Detector: $FULL_IMAGE_DETECTOR"
echo""
echo "🌐 S3 Website:"
echo "  ● Bucket: s3://$S3_BUCKET"
echo "  ● URL: http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
echo ""

print_header "다음 단계: 서비스 배포"

echo ""
echo -e "${YELLOW}=== Option 1: Docker Compose (로컬/EC2) ===${NC}"
echo ""
echo "1. docker-compose.yml 업데이트:"
echo "   services:"
echo "     camera-server:"
echo "       image: $FULL_IMAGE_SERVER"
echo ""
echo "     motion-detector:"
echo "       image: $FULL_IMAGE_DETECTOR"
echo ""
echo "2. 실행:"
echo "   docker compose up -d"
echo ""

echo -e "${YELLOW}=== Option 2: AWS App Runner ===${NC}"
echo ""
echo "1. Camera Server 배포:"
echo "   • Image URI: $FULL_IMAGE_SERVER"
echo "   • Port: 8887"
echo "   • CPU/Memory: 1 vCPU, 2 GB"
echo ""
echo "2. Motion Detector 배포:"
echo "   • Image URI: $FULL_IMAGE_DETECTOR"
echo "   • Environment Variables:"
echo "     WEBSOCKET_SERVER=ws://[server-url]:8887"
echo "     ENABLE_AI=true"
echo "     OPENAI_API_KEY=sk-xxx (optional)"
echo "   • CPU/Memory: 0.5 vCPU, 1 GB"
echo ""
echo "3. 클라이언트 업데이트:"
echo "   • WebSocket URL을 .env.production 파일에 설정"
echo "   • 재빌드 후 S3 재배포"
echo ""

print_warning "자세한 가이드: DEPLOYMENT.md 참고"
echo ""
