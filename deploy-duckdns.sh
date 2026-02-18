#!/bin/bash
# DuckDNS 설정 스크립트를 EC2로 전송하고 실행하는 스크립트

set -e

EC2_HOST="ec2-user@52.79.241.244"
EC2_DIR="/home/ec2-user"

echo "=========================================="
echo "EC2에 DuckDNS 설정 스크립트 전송"
echo "=========================================="

# 스크립트 파일들 전송
echo "1️⃣  스크립트 파일 전송 중..."
scp -i ~/.ssh/your-key.pem \
    setup-duckdns.sh \
    setup-ssl.sh \
    ${EC2_HOST}:${EC2_DIR}/

echo ""
echo "✅ 파일 전송 완료!"
echo ""
echo "=========================================="
echo "다음 단계: EC2에 SSH 접속 후 실행"
echo "=========================================="
echo ""
echo "ssh -i ~/.ssh/your-key.pem ${EC2_HOST}"
echo ""
echo "# EC2에서 실행할 명령어:"
echo "chmod +x setup-duckdns.sh setup-ssl.sh"
echo "sudo ./setup-duckdns.sh"
echo ""
