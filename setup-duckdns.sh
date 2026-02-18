#!/bin/bash
# DuckDNS 자동 설정 스크립트
# EC2에서 실행하세요

set -e

echo "=========================================="
echo "DuckDNS 설정 시작"
echo "=========================================="

# 사용자 입력 받기
read -p "DuckDNS 토큰을 입력하세요: " DUCKDNS_TOKEN
read -p "DuckDNS 서브도메인을 입력하세요 (예: esp32camera): " DUCKDNS_DOMAIN

# 입력 검증
if [ -z "$DUCKDNS_TOKEN" ] || [ -z "$DUCKDNS_DOMAIN" ]; then
    echo "❌ 토큰과 도메인은 필수 입력값입니다."
    exit 1
fi

echo ""
echo "📝 설정 정보:"
echo "  - 도메인: ${DUCKDNS_DOMAIN}.duckdns.org"
echo "  - 토큰: ${DUCKDNS_TOKEN:0:10}..."
echo ""

# DuckDNS 업데이트 스크립트 생성
echo "1️⃣  DuckDNS 업데이트 스크립트 생성..."
sudo tee /usr/local/bin/duckdns-update.sh > /dev/null <<EOF
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=" | curl -k -o /var/log/duckdns.log -K -
EOF

sudo chmod +x /usr/local/bin/duckdns-update.sh

# 첫 실행 테스트
echo "2️⃣  DuckDNS 업데이트 테스트..."
sudo /usr/local/bin/duckdns-update.sh
sleep 2

# 로그 확인
if grep -q "OK" /var/log/duckdns.log; then
    echo "✅ DuckDNS 업데이트 성공!"
else
    echo "❌ DuckDNS 업데이트 실패. 토큰과 도메인을 확인하세요."
    cat /var/log/duckdns.log
    exit 1
fi

# systemd 서비스 생성
echo "3️⃣  systemd 서비스 생성..."
sudo tee /etc/systemd/system/duckdns.service > /dev/null <<EOF
[Unit]
Description=DuckDNS IP Update Service
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/duckdns-update.sh
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# systemd 타이머 생성 (5분마다 IP 갱신)
sudo tee /etc/systemd/system/duckdns.timer > /dev/null <<EOF
[Unit]
Description=DuckDNS IP Update Timer
Requires=duckdns.service

[Timer]
OnBootSec=1min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
EOF

# 서비스 활성화
echo "4️⃣  서비스 활성화..."
sudo systemctl daemon-reload
sudo systemctl enable duckdns.timer
sudo systemctl start duckdns.timer

echo ""
echo "=========================================="
echo "✅ DuckDNS 설정 완료!"
echo "=========================================="
echo ""
echo "📌 확인 사항:"
echo "  - 도메인: https://${DUCKDNS_DOMAIN}.duckdns.org"
echo "  - 현재 IP: $(curl -s ifconfig.me)"
echo ""
echo "🔍 상태 확인 명령어:"
echo "  sudo systemctl status duckdns.timer"
echo "  sudo journalctl -u duckdns -f"
echo "  cat /var/log/duckdns.log"
echo ""
echo "다음 단계: setup-ssl.sh 실행"
echo ""
