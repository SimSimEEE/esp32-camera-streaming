#!/bin/bash
set -e

# ESP32 Camera Streaming - AWS ECR Push Script
# Author: Sim Si-Geun
# Date: 2026-02-17

# 설정
AWS_REGION="${AWS_REGION:-ap-northeast-2}"
AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-YOUR_ACCOUNT_ID}"
ECR_REPO="esp32-camera-server"
IMAGE_TAG="${IMAGE_TAG:-latest}"

echo "🚀 ESP32 Camera Server - AWS ECR Push"
echo "========================================"
echo "Region: $AWS_REGION"
echo "Account ID: $AWS_ACCOUNT_ID"
echo "Repository: $ECR_REPO"
echo "Tag: $IMAGE_TAG"
echo ""

# 색상 정의
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# AWS 계정 ID 확인
if [ "$AWS_ACCOUNT_ID" == "YOUR_ACCOUNT_ID" ]; then
    echo -e "${RED}Error: Please set AWS_ACCOUNT_ID environment variable${NC}"
    echo "Usage: AWS_ACCOUNT_ID=123456789 ./deploy-ecr.sh"
    exit 1
fi

# ECR 리포지토리 URL
ECR_URL="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
FULL_IMAGE_NAME="${ECR_URL}/${ECR_REPO}:${IMAGE_TAG}"

# Step 1: ECR 로그인
echo -e "${GREEN}▶ Step 1: Logging in to ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $ECR_URL

# Step 2: ECR 리포지토리 생성 (없으면)
echo -e "${GREEN}▶ Step 2: Creating ECR repository (if not exists)...${NC}"
aws ecr describe-repositories --repository-names $ECR_REPO --region $AWS_REGION 2>/dev/null || \
    aws ecr create-repository --repository-name $ECR_REPO --region $AWS_REGION

# Step 3: 이미지 태깅
echo -e "${GREEN}▶ Step 3: Tagging image...${NC}"
docker tag esp32-camera-server:latest $FULL_IMAGE_NAME

# Step 4: 이미지 푸시
echo -e "${GREEN}▶ Step 4: Pushing image to ECR...${NC}"
docker push $FULL_IMAGE_NAME

# 완료
echo ""
echo -e "${GREEN}✓ Successfully pushed to ECR!${NC}"
echo ""
echo "Image URI: $FULL_IMAGE_NAME"
echo ""
echo "Next steps:"
echo "  1. Go to AWS App Runner console"
echo "  2. Create service with this image"
echo "  3. Set port to 8887"
echo "  4. Deploy!"
echo ""
