#!/bin/bash
# 
# `quick-deploy.sh`
# - ESP32 Camera Streaming 빠른 배포 스크립트
#
# @author      Sim Si-Geun <simsimee@lemoncloud.io>
# @date        2026-02-18 initial version
#
# @copyright   (C) 2026 LemonCloud Co Ltd. - All Rights Reserved.

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;36m'
NC='\033[0m'

# 현재 디렉토리
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 배너 출력
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════╗
║                                                      ║
║     ESP32 Camera Streaming - Quick Deploy           ║
║     v1.0.0                                           ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# 함수 정의
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}▶ $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
    echo -e "${GREEN}  ✓ $1${NC}"
}

print_error() {
    echo -e "${RED}  ✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}  ⚠ $1${NC}"
}

print_info() {
    echo -e "  • $1"
}

# 배포 타입 선택
echo ""
echo "배포 타입을 선택하세요:"
echo "  1) 로컬 테스트 (Docker)"
echo "  2) AWS 클라우드 (ECR + S3)"
echo "  3) 전체 배포 (AWS + ESP32)"
echo "  4) ESP32 펌웨어만"
echo ""
read -p "선택 (1-4): " DEPLOY_TYPE

case $DEPLOY_TYPE in
    1)
        # 로컬 Docker 배포
        print_header "로컬 Docker 배포"
        
        print_step "Step 1: 서버 빌드 중..."
        cd "$SCRIPT_DIR/esp32-camera-server"
        mvn clean package -DskipTests -q
        
        print_step "Step 2: Docker 이미지 빌드 중..."
        docker build -t esp32-camera-server:latest . -q
        
        print_step "Step 3: 기존 컨테이너 정리..."
        docker stop esp32-camera-server 2>/dev/null || true
        docker rm esp32-camera-server 2>/dev/null || true
        
        print_step "Step 4: 서버 실행 중..."
        docker run -d --name esp32-camera-server \
            -p 8887:8887 \
            --restart unless-stopped \
            esp32-camera-server:latest
        
        sleep 2
        
        print_step "배포 완료!"
        echo ""
        print_info "서버 URL: http://localhost:8887"
        print_info "로그 확인: docker logs -f esp32-camera-server"
        print_info "중지: docker stop esp32-camera-server"
        echo ""
        print_info "이제 웹 클라이언트를 실행하세요:"
        print_info "  cd esp32-camera-client && npm run dev"
        ;;
        
    2)
        # AWS 배포
        print_header "AWS 클라우드 배포"
        
        # AWS 설정 확인
        print_step "Step 1: AWS 계정 확인 중..."
        AWS_ACCOUNT_ID=$(aws sts get-caller-identity --output text --query 'Account' 2>/dev/null || echo "")
        
        if [ -z "$AWS_ACCOUNT_ID" ]; then
            print_error "AWS CLI가 설정되지 않았습니다."
            echo ""
            echo "AWS CLI 설정 방법:"
            echo "  aws configure"
            echo ""
            exit 1
        fi
        
        print_info "Account ID: $AWS_ACCOUNT_ID"
        
        # 자동 배포 스크립트 실행
        print_step "Step 2: 전체 배포 실행 중..."
        ./deploy-production.sh
        ;;
        
    3)
        # 전체 배포 (AWS + ESP32)
        print_header "전체 배포 (AWS + ESP32)"
        
        # AWS 배포
        print_step "Step 1: AWS 클라우드 배포..."
        ./deploy-production.sh
        
        # ESP32 빌드
        print_step "Step 2: ESP32 펌웨어 빌드..."
        cd "$SCRIPT_DIR/esp32-camera-firmware"
        
        # PlatformIO가 설치되어 있는지 확인
        if command -v pio &> /dev/null; then
            print_info "PlatformIO 감지됨"
            pio run
            
            echo ""
            read -p "ESP32를 USB에 연결했나요? 업로드를 진행하시겠습니까? (y/n): " UPLOAD_CONFIRM
            
            if [ "$UPLOAD_CONFIRM" == "y" ]; then
                print_step "ESP32에 업로드 중..."
                pio run --target upload
                
                echo ""
                print_step "배포 완료!"
                print_info "시리얼 모니터: pio device monitor"
            else
                print_warning "업로드를 건너뜁니다."
                print_info "나중에 업로드하려면: cd esp32-camera-firmware && pio run --target upload"
            fi
        else
            print_warning "PlatformIO가 설치되지 않았습니다."
            print_info "Arduino IDE를 사용하여 수동으로 업로드하세요:"
            print_info "  esp32-camera-firmware/ESP32_Camera_Stream/ESP32_Camera_Stream.ino"
        fi
        ;;
        
    4)
        # ESP32 펌웨어만
        print_header "ESP32 펌웨어 빌드 및 업로드"
        
        cd "$SCRIPT_DIR/esp32-camera-firmware"
        
        # PlatformIO가 설치되어 있는지 확인
        if command -v pio &> /dev/null; then
            print_step "Step 1: 펌웨어 빌드 중..."
            pio run
            
            print_step "Step 2: 환경 변수 확인..."
            echo ""
            echo "현재 설정 (ESP32_Camera_Stream/Config.h):"
            grep -E "define (WIFI_SSID|WIFI_PASSWORD|WS_HOST|WS_PORT)" ESP32_Camera_Stream/Config.h || true
            echo ""
            
            read -p "설정을 확인했습니다. 업로드를 진행하시겠습니까? (y/n): " UPLOAD_CONFIRM
            
            if [ "$UPLOAD_CONFIRM" == "y" ]; then
                echo ""
                print_step "ESP32에 업로드 중..."
                print_warning "ESP32-CAM을 USB에 연결하고 BOOT 버튼을 누른 상태에서 진행하세요."
                sleep 2
                
                pio run --target upload
                
                echo ""
                print_step "업로드 완료!"
                print_info "ESP32-CAM을 재부팅하세요 (RESET 버튼 또는 전원 재연결)"
                print_info "시리얼 모니터: pio device monitor"
            else
                print_warning "업로드를 건너뜁니다."
            fi
        else
            print_warning "PlatformIO가 설치되지 않았습니다."
            echo ""
            print_info "Arduino IDE를 사용하여 수동으로 업로드하세요:"
            print_info "  1. Arduino IDE 실행"
            print_info "  2. 파일 → 열기 → esp32-camera-firmware/ESP32_Camera_Stream/ESP32_Camera_Stream.ino"
            print_info "  3. 도구 → 보드 → ESP32 Arduino → AI Thinker ESP32-CAM"
            print_info "  4. 도구 → 포트 → (ESP32가 연결된 포트 선택)"
            print_info "  5. 스케치 → 업로드"
        fi
        ;;
        
    *)
        print_error "잘못된 선택입니다."
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ 배포 프로세스 완료!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "📚 추가 정보는 DEPLOY_GUIDE.md를 참고하세요."
echo ""
