#!/bin/bash
# 
# `deploy-ec2.sh`
# - EC2 서버 배포 스크립트 (52.79.241.244)
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

# EC2 설정
EC2_HOST="52.79.241.244"
EC2_USER="ec2-user"
SSH_KEY="${SSH_KEY:-$HOME/.ssh/aws-ec2.pem}"  # 환경변수로 키 경로 지정 가능
PROJECT_PATH="/home/ec2-user/esp32-camera-streaming"

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

# 배너
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════╗
║                                                      ║
║     ESP32 Camera - EC2 Deployment                    ║
║     Target: 52.79.241.244                            ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# SSH 키 확인
print_header "Step 1: SSH 설정 확인"

if [ ! -f "$SSH_KEY" ]; then
    print_error "SSH 키를 찾을 수 없습니다: $SSH_KEY"
    echo ""
    echo "SSH 키 설정 방법:"
    echo ""
    echo "1. SSH 키 파일이 있는 경우:"
    echo "   export SSH_KEY=/path/to/your-key.pem"
    echo "   chmod 400 \$SSH_KEY"
    echo "   ./deploy-ec2.sh"
    echo ""
    echo "2. SSH 키 파일이 없는 경우:"
    echo "   AWS Console → EC2 → Key Pairs에서 키 다운로드"
    echo "   또는 ~/.ssh/config에 설정 추가:"
    echo ""
    echo "   Host ec2-esp32"
    echo "     HostName 52.79.241.244"
    echo "     User ec2-user"
    echo "     IdentityFile ~/.ssh/your-key.pem"
    echo ""
    echo "3. 비밀번호 인증이 활성화된 경우:"
    echo "   ssh ec2-user@52.79.241.244"
    echo ""
    exit 1
fi

print_step "SSH 키 확인: $SSH_KEY"

# SSH 연결 테스트
print_header "Step 2: SSH 연결 테스트"

SSH_CMD="ssh -i $SSH_KEY -o ConnectTimeout=5 -o StrictHostKeyChecking=no"

if ! $SSH_CMD $EC2_USER@$EC2_HOST "echo 'SSH OK'" 2>/dev/null; then
    print_error "SSH 연결 실패"
    echo ""
    echo "문제 해결 방법:"
    echo "  1. SSH 키 권한 확인: chmod 400 $SSH_KEY"
    echo "  2. 보안 그룹에서 SSH 포트(22) 개방 확인"
    echo "  3. EC2 인스턴스가 실행 중인지 확인"
    echo "  4. 수동 연결 테스트: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST"
    echo ""
    exit 1
fi

print_step "SSH 연결 성공"

# 배포 방법 선택
echo ""
echo "배포 방법을 선택하세요:"
echo "  1) Docker 이미지 배포 (빠름, 추천)"
echo "  2) Git Pull + 빌드 배포 (느림, 소스 동기화)"
echo "  3) 상태 확인만"
echo ""
read -p "선택 (1-3): " DEPLOY_TYPE

case $DEPLOY_TYPE in
    1)
        # Docker 이미지 배포
        print_header "Docker 이미지 배포"
        
        print_step "Step 1: 로컬 Docker 이미지 확인..."
        if ! docker images | grep -q "esp32-camera-server.*latest"; then
            print_warning "로컬 Docker 이미지가 없습니다. 빌드 중..."
            cd esp32-camera-server
            npm run build
            cd ..
        fi
        
        print_step "Step 2: Docker 이미지 저장..."
        docker save esp32-camera-server:latest | gzip > /tmp/esp32-camera-server.tar.gz
        
        print_step "Step 3: EC2로 이미지 전송..."
        scp -i $SSH_KEY -o StrictHostKeyChecking=no \
            /tmp/esp32-camera-server.tar.gz \
            $EC2_USER@$EC2_HOST:/tmp/
        
        print_step "Step 4: EC2에서 이미지 로드 및 실행..."
        $SSH_CMD $EC2_USER@$EC2_HOST << 'ENDSSH'
            # Docker 이미지 로드
            docker load < /tmp/esp32-camera-server.tar.gz
            
            # 기존 컨테이너 중지 및 제거
            docker stop esp32-camera-server 2>/dev/null || true
            docker rm esp32-camera-server 2>/dev/null || true
            
            # 새 컨테이너 실행
            docker run -d \
                --name esp32-camera-server \
                --restart unless-stopped \
                -p 80:8887 \
                -p 8887:8887 \
                esp32-camera-server:latest
            
            # 정리
            rm -f /tmp/esp32-camera-server.tar.gz
            
            echo ""
            echo "컨테이너 상태:"
            docker ps | grep esp32-camera-server
ENDSSH
        
        print_step "배포 완료!"
        rm -f /tmp/esp32-camera-server.tar.gz
        ;;
        
    2)
        # Git Pull + 빌드 배포
        print_header "Git Pull + 빌드 배포"
        
        print_step "Step 1: Git 변경사항 확인..."
        if ! git diff-index --quiet HEAD --; then
            print_warning "커밋되지 않은 변경사항이 있습니다."
            read -p "계속하시겠습니까? (y/n): " CONTINUE
            if [ "$CONTINUE" != "y" ]; then
                echo "배포를 취소합니다."
                exit 0
            fi
        fi
        
        print_step "Step 2: Git Push..."
        git push origin master || print_warning "Push 실패 (계속 진행)"
        
        print_step "Step 3: EC2에서 Git Pull 및 빌드..."
        $SSH_CMD $EC2_USER@$EC2_HOST << ENDSSH
            cd $PROJECT_PATH
            
            # Git Pull
            git pull origin master
            
            # 서버 빌드 및 배포
            cd esp32-camera-server
            
            # Docker 빌드
            docker build -t esp32-camera-server:latest .
            
            # 기존 컨테이너 중지 및 제거
            docker stop esp32-camera-server 2>/dev/null || true
            docker rm esp32-camera-server 2>/dev/null || true
            
            # 새 컨테이너 실행
            docker run -d \
                --name esp32-camera-server \
                --restart unless-stopped \
                -p 80:8887 \
                -p 8887:8887 \
                esp32-camera-server:latest
            
            echo ""
            echo "컨테이너 상태:"
            docker ps | grep esp32-camera-server
ENDSSH
        
        print_step "배포 완료!"
        ;;
        
    3)
        # 상태 확인
        print_header "서버 상태 확인"
        
        $SSH_CMD $EC2_USER@$EC2_HOST << 'ENDSSH'
            echo "=== Docker 컨테이너 상태 ==="
            docker ps -a | grep esp32-camera-server || echo "컨테이너 없음"
            
            echo ""
            echo "=== Docker 이미지 ==="
            docker images | grep esp32-camera-server || echo "이미지 없음"
            
            echo ""
            echo "=== 포트 사용 현황 ==="
            sudo netstat -tulpn | grep -E ":80|:8887" || echo "포트 사용 없음"
            
            echo ""
            echo "=== 최근 로그 (10줄) ==="
            docker logs --tail 10 esp32-camera-server 2>/dev/null || echo "로그 없음"
ENDSSH
        ;;
        
    *)
        print_error "잘못된 선택입니다."
        exit 1
        ;;
esac

# 배포 결과
print_header "배포 완료!"

echo ""
echo -e "${GREEN}✓ 배포가 완료되었습니다!${NC}"
echo ""
echo "접속 URL:"
echo "  • HTTP:  http://52.79.241.244"
echo "  • HTTP:  http://52.79.241.244:8887"
echo ""
echo "유용한 명령어:"
echo "  • 로그 확인: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST \"docker logs -f esp32-camera-server\""
echo "  • 재시작:   ssh -i $SSH_KEY $EC2_USER@$EC2_HOST \"docker restart esp32-camera-server\""
echo "  • 중지:     ssh -i $SSH_KEY $EC2_USER@$EC2_HOST \"docker stop esp32-camera-server\""
echo ""
