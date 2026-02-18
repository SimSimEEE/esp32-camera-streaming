#!/bin/bash
set -e

# ESP32 Camera Streaming - Production Deployment Script
# Author: Sim Si-Geun
# Date: 2026-02-17

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m' # No Color

# 설정
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
ECR_REPO="esp32-camera-server"
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
print_header "ESP32 Camera Streaming - Production Deployment"

# AWS 계정 확인
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
FULL_IMAGE_NAME="${ECR_URL}/${ECR_REPO}:latest"

# ==========================================
# 서버 배포
# ==========================================

print_header "Part 1: 서버 배포 (Docker → ECR)"

# Step 2: 서버 빌드
print_step "Step 2: 서버 Docker 이미지 빌드..."
cd "$SCRIPT_DIR/esp32-camera-server"
npm run build > /dev/null 2>&1
print_success "Docker 이미지 빌드 완료"

# Step 3: ECR 리포지토리 생성
print_step "Step 3: ECR 리포지토리 확인/생성..."
aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION > /dev/null
print_success "ECR 리포지토리 준비 완료"

# Step 4: ECR 로그인
print_step "Step 4: ECR 로그인..."
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $ECR_URL > /dev/null 2>&1
print_success "ECR 로그인 완료"

# Step 5: 이미지 태깅
print_step "Step 5: 이미지 태깅..."
docker tag esp32-camera-server:latest $FULL_IMAGE_NAME
print_success "이미지 태깅 완료"

# Step 6: ECR 푸시
print_step "Step 6: ECR에 이미지 푸시..."
docker push $FULL_IMAGE_NAME > /dev/null 2>&1
print_success "ECR 푸시 완료"

echo ""
print_success "서버 이미지 URI: $FULL_IMAGE_NAME"

# ==========================================
# 클라이언트 배포
# ==========================================

print_header "Part 2: 클라이언트 배포 (S3)"

cd "$SCRIPT_DIR/esp32-camera-client"

# Step 7: S3 버킷 확인
print_step "Step 7: S3 버킷 확인/생성..."
aws s3 ls s3://$S3_BUCKET 2>/dev/null || {
    print_warning "S3 버킷이 없습니다. 생성 중..."
    aws s3 mb s3://$S3_BUCKET --region $AWS_REGION
    
    # 정적 웹 호스팅 활성화
    aws s3 website s3://$S3_BUCKET --index-document index.html
    
    # 퍼블릭 액세스 차단 해제
    aws s3api put-public-access-block \
        --bucket $S3_BUCKET \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    # 버킷 정책 설정
    cat > /tmp/bucket-policy.json << EOF
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
EOF
    aws s3api put-bucket-policy --bucket $S3_BUCKET --policy file:///tmp/bucket-policy.json
    rm /tmp/bucket-policy.json
}
print_success "S3 버킷 준비 완료"

# Step 8: S3 업로드
print_step "Step 8: S3에 파일 업로드..."
aws s3 sync . s3://$S3_BUCKET \
    --exclude "package.json" \
    --exclude "package-lock.json" \
    --exclude "README.md" \
    --exclude ".DS_Store" \
    --exclude "node_modules/*" \
    --delete
print_success "S3 업로드 완료"

# ==========================================
# 배포 완료
# ==========================================

cd "$SCRIPT_DIR"

print_header "🎉 배포 완료!"

echo ""
echo -e "${GREEN}서버 정보:${NC}"
echo "  ● ECR 이미지: $FULL_IMAGE_NAME"
echo "  ● 다음 단계: AWS App Runner 또는 EC2에서 이 이미지로 서비스 생성"
echo ""
echo -e "${GREEN}클라이언트 정보:${NC}"
echo "  ● S3 버킷: s3://$S3_BUCKET"
echo "  ● 웹사이트 URL: http://$S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"
echo ""

# App Runner 배포 가이드
print_header "다음 단계: App Runner 배포"

echo ""
echo "1. AWS Console → App Runner로 이동"
echo ""
echo "2. Create service 클릭"
echo ""
echo "3. 설정:"
echo "   - Source: Container registry → Amazon ECR"
echo "   - Image URI: $FULL_IMAGE_NAME"
echo "   - Port: 8887"
echo "   - CPU/Memory: 1 vCPU, 2 GB (권장)"
echo ""
echo "4. 배포 완료 후 서비스 URL 확인 (예: https://xxx.ap-northeast-2.awsapprunner.com)"
echo ""
echo "5. config.js 업데이트:"
echo "   cd esp32-camera-client"
echo "   # production.wsUrl을 App Runner URL로 변경"
echo "   # 예: wss://xxx.ap-northeast-2.awsapprunner.com/viewer"
echo ""
echo "6. 클라이언트 재배포:"
echo "   aws s3 sync . s3://$S3_BUCKET"
echo ""

# CloudFront 추가 가이드 (선택사항)
print_warning "선택사항: CloudFront CDN 추가로 더 빠른 글로벌 액세스 가능"
echo "  → DEPLOYMENT.md 참고"
echo ""
