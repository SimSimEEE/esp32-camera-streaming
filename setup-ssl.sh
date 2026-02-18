#!/bin/bash
# SSL 인증서 자동 발급 스크립트 (Let's Encrypt + Nginx)
# EC2에서 실행하세요

set -e

echo "=========================================="
echo "SSL 인증서 및 Nginx 설정 시작"
echo "=========================================="

# 도메인 입력 받기
read -p "DuckDNS 전체 도메인을 입력하세요 (예: esp32camera.duckdns.org): " DOMAIN
read -p "이메일 주소를 입력하세요 (인증서 알림용): " EMAIL

# 입력 검증
if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "❌ 도메인과 이메일은 필수 입력값입니다."
    exit 1
fi

echo ""
echo "📝 설정 정보:"
echo "  - 도메인: ${DOMAIN}"
echo "  - 이메일: ${EMAIL}"
echo ""

# Nginx 및 Certbot 설치
echo "1️⃣  Nginx 및 Certbot 설치..."
sudo yum update -y
sudo yum install -y nginx
sudo amazon-linux-extras install -y epel
sudo yum install -y certbot python3-certbot-nginx

# Nginx 시작
sudo systemctl enable nginx
sudo systemctl start nginx

# 방화벽 설정 (Security Group에서도 80, 443 포트 열어야 함)
echo "2️⃣  방화벽 설정..."
if command -v firewall-cmd &> /dev/null; then
    sudo firewall-cmd --permanent --add-service=http
    sudo firewall-cmd --permanent --add-service=https
    sudo firewall-cmd --reload
fi

# Nginx 기본 설정 (SSL 발급 전)
echo "3️⃣  Nginx 기본 설정..."
sudo tee /etc/nginx/conf.d/esp32-camera.conf > /dev/null <<EOF
server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        return 200 'OK';
        add_header Content-Type text/plain;
    }
}
EOF

sudo nginx -t
sudo systemctl reload nginx

# SSL 인증서 발급
echo "4️⃣  SSL 인증서 발급 중..."
echo "⚠️  도메인이 현재 EC2 IP를 정확히 가리키고 있는지 확인하세요!"
sleep 3

sudo certbot --nginx -d ${DOMAIN} --non-interactive --agree-tos --email ${EMAIL} --redirect

# WebSocket Proxy 설정
echo "5️⃣  WebSocket Proxy 설정..."
sudo tee /etc/nginx/conf.d/esp32-camera.conf > /dev/null <<EOF
# HTTP -> HTTPS 리다이렉트
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

# HTTPS + WebSocket Proxy
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL 인증서 (Certbot이 자동으로 설정)
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # WebSocket Proxy 설정
    location / {
        proxy_pass http://localhost:8887;
        proxy_http_version 1.1;
        
        # WebSocket 필수 헤더
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host \$host;
        
        # Proxy 헤더
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Timeout 설정 (WebSocket 장시간 연결 유지)
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Health Check
    location /health {
        access_log off;
        return 200 "OK\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Nginx 설정 검증 및 재시작
echo "6️⃣  Nginx 재시작..."
sudo nginx -t
sudo systemctl reload nginx

# Auto-renewal 설정 (Certbot이 자동으로 cron 설정)
echo "7️⃣  SSL 자동 갱신 확인..."
sudo certbot renew --dry-run

echo ""
echo "=========================================="
echo "✅ SSL 및 Nginx 설정 완료!"
echo "=========================================="
echo ""
echo "📌 접속 URL:"
echo "  - HTTPS: https://${DOMAIN}"
echo "  - WebSocket: wss://${DOMAIN}/viewer"
echo ""
echo "🔍 확인 명령어:"
echo "  sudo systemctl status nginx"
echo "  sudo certbot certificates"
echo "  curl https://${DOMAIN}/health"
echo ""
echo "⚠️  Security Group 확인:"
echo "  - 80 포트 (HTTP) 열기"
echo "  - 443 포트 (HTTPS) 열기"
echo "  - 8887 포트는 localhost만 접근하도록 설정"
echo ""
echo "다음 단계: 클라이언트 코드에서 wss://${DOMAIN}/viewer 사용"
echo ""
