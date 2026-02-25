/**
 * `ProjectCards.tsx`
 * - Project showcase cards with expandable detail depth
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { useState, useRef, useEffect } from "react";
import {
    ShoppingCart,
    CreditCard,
    Shield,
    Settings,
    Globe,
    MessageSquare,
    Github,
    ExternalLink,
    Layers,
    AlertTriangle,
    BarChart2,
    CheckCircle2,
    UserCog,
    Lightbulb,
    X,
    Play,
} from "lucide-react";
import CameraViewer from "./CameraViewer";

interface Metric {
    label: string;
    value: string;
}

interface ProblemSolving {
    problem: string; // 문제 상황
    approach: string; // 사고 접근
    solution: string; // 해결책
}

interface Project {
    id: number;
    title: string;
    company: string;
    period: string;
    role: string; // 담당 역할
    description: string;
    icon: typeof ShoppingCart;
    color: string;
    tags: string[];
    highlights: string[];
    link?: string;
    // 확장 영역 (선택적 뎁스)
    architecture?: string[];
    challenges?: string[];
    metrics?: Metric[];
    outcome?: string[]; // 성과
    problemSolving?: ProblemSolving[]; // 문제 해결 사고 과정
}

const projects: Project[] = [
    {
        id: 1,
        title: "운영·관리 시스템",
        company: "에스엘플랫폼",
        period: "2024.01 - 2024.12",
        role: "백엔드 개발 · 서비스 통합 · 데이터 모델 고도화",
        description: "회원·세대 관리, 예약·이용내역, 운영 정책, 통계·대시보드 전반 담당",
        icon: Settings,
        color: "from-blue-500 to-cyan-500",
        tags: ["TypeScript", "Node.js", "DynamoDB", "REST API", "AWS Lambda"],
        highlights: [
            "회원·세대 관리, 예약 및 이용내역 기록 시스템 구현",
            "단지 단위 요금 계산 및 정산 시스템 설계",
            "배송/구매 제한, 회원 정책(탈퇴·퇴거·정지), 예약 자동연장 등 운영 정책 API 구현",
            "내부 어드민 통계·대시보드 및 권한별 접근 제어",
        ],
        architecture: [
            "멀티 테넌트 DynamoDB 파티션 키 전략으로 단지별 데이터 격리",
            "Lambda 이벤트 기반 비동기 처리로 통계 집계를 메인 플로우와 분리",
            "Manager-Proxy-Transformer 레이어드 아키텍처 적용으로 비즈니스 로직 캡슐화",
            "SNS/SQS 기반 Slack 알림 연동으로 에러 자동 감지 및 실시간 리포팅",
        ],
        challenges: [
            "세대 수 증가에 따른 페이지네이션 성능 저하 → GSI 파티션 전략 재설계로 해소",
            "어드민·세대원·관리자·운영자 다단계 ACL 권한 모델 설계 및 Proxy 레이어 적용",
            "운영 정책 항목 증가에 따른 API 분기 복잡도 → Strategy 패턴으로 정책 모듈화",
        ],
        metrics: [
            { label: "적용 단지", value: "30+" },
            { label: "API 엔드포인트", value: "120+" },
            { label: "월 처리 건수", value: "50만+" },
        ],
        outcome: [
            "운영 안정화 및 신규 서비스 확장 기반 마련",
            "데이터 모델 개선으로 다수 단지 온보딩 속도 단축",
            "운영 정책 API 구조 최적화로 정책 추가 비용 최소화",
        ],
        problemSolving: [
            {
                problem:
                    "세대 수 증가 후 전체 조회 Lambda가 6초+ 타임아웃으로 서비스 응답 불가 상황",
                approach:
                    "DynamoDB 파티션 설계와 접근 패턴 불일치 의심 → 기존 GSI의 풀스캔 원인 분석 → 단지 ID 기반 파티셔닝 재검토",
                solution:
                    "단지 ID를 PK, 날짜를 SK로 하는 GSI 추가 및 Sparse Index 활용 → 쿼리 타임 90% 단축",
            },
            {
                problem:
                    "권한 체계에 운영자 역할이 추가되면서 if-else 권한 분기 코드 수십 개로 폭증",
                approach:
                    "Proxy 패턴을 통한 레이어 분리 검토 → 컨트롤러는 역할 주입만, 실제 권한 검증은 Proxy가 담당하도록 역할 분리",
                solution:
                    "역할별 Proxy 클래스 정의 → 컨트롤러 코드는 역할 주입만, 권한 로직 중복 완전 제거",
            },
        ],
    },
    {
        id: 2,
        title: "결제·정산 시스템",
        company: "에스엘플랫폼",
        period: "2024.03 - 2024.11",
        role: "백엔드 설계 · 결제 모듈 통합 · API 최적화",
        description: "단말기 연동 결제, PG사 웹훅 처리, 세대별 관리비·추가비용 정산 시스템 구현",
        icon: CreditCard,
        color: "from-green-500 to-emerald-500",
        tags: ["TypeScript", "Node.js", "DynamoDB", "Elasticsearch", "SQS"],
        highlights: [
            "키오스크·포스 단말기 연동 결제 처리 모듈 설계",
            "PG사 연동, 결제 성공/실패 로깅 및 웹훅 처리",
            "세대별 관리비·추가비용 정산 프로세스 최적화",
            "Elasticsearch 기반 결제 이력 조회 및 통계 API 제공",
        ],
        architecture: [
            "Idempotency Key 기반 중복 결제 방지 레이어 설계",
            "웹훅 수신 후 SQS 큐잉으로 비동기 정산 처리 파이프라인 구성",
            "Elasticsearch 결제 이력 인덱싱으로 복잡 조건 검색·집계 처리",
            "Lambda 환경에서 에러 자동 감지 및 Slack 알림 체계 활용",
        ],
        challenges: [
            "PG사 통신 타임아웃 시 결제 상태 불일치 → 보상 트랜잭션 패턴으로 해소",
            "정산 배치 처리 시 DynamoDB 쓰로틀링 → 지연 재시도·분산 write 전략 적용",
            "PG사별 응답 포맷 상이 → Transformer 패턴으로 공통 결제 모델로 정규화",
        ],
        metrics: [
            { label: "정산 정확도", value: "99.9%" },
            { label: "처리 속도", value: "↑ 40%" },
            { label: "연동 PG사", value: "3개사" },
        ],
        outcome: [
            "결제 안정성 확보 및 단말기·PG사 확장 구조 완성",
            "정산 처리 속도 40% 개선으로 운영 효율 향상",
            "비동기 처리 도입으로 결제 응답 지연 없이 정산 적재 분리",
        ],
        problemSolving: [
            {
                problem:
                    "PG사 HTTP 타임아웃(3s) 후 재시도 시 동일 결제 중복 발생 → 사용자에게 이중 청구",
                approach:
                    "멱등성(Idempotency) 관점에서 분석 → 결제 요청마다 서버가 고유 Key 생성·저장, 재시도 시 동일 요청 식별 방안 검토",
                solution:
                    "UUID 기반 Idempotency Key를 DynamoDB에 TTL 저장, 재시도 시 기존 결과 반환 → 이중 청구 완전 차단",
            },
            {
                problem:
                    "PG사별 응답 포맷이 달라 결제 코드에 PG사 분기 로직이 세분화되어 확장마다 수정 반복",
                approach:
                    "외부 취약점 차단을 위해 Transformer 패턴 검토 → PG사별 응답만 정규화하고 내부는 단일 결제 모델 사용",
                solution:
                    "PG사마다 Transformer 구현체 작성 → 코어 결제 로직은 통일 모델만 사용, 신규 PG사 추가 시 코드 무수정",
            },
        ],
    },
    {
        id: 3,
        title: "출입·보안 시스템",
        company: "에스엘플랫폼",
        period: "2024.06 - 2024.12",
        role: "백엔드 개발 · 모듈화 · 통합 API 설계",
        description: "QR/NFC/CARD 출입 제어, 주차 관제 연동, 출입 이력 기반 BI 분석 시스템",
        icon: Shield,
        color: "from-purple-500 to-pink-500",
        tags: ["TypeScript", "Node.js", "MySQL", "DynamoDB", "ACL"],
        highlights: [
            "QR/NFC/CARD 출입 제어 시스템 및 권한 기반 접근 관리",
            "주차 관제 시스템 연동 및 MySQL 기반 출입·주차 DB 조회",
            "출입·주차 기록 로그 관리 및 BI 대시보드 통계 연동",
            "MySQL 정기 백업 자동화 및 DynamoDB 세션 상태 이중 저장",
        ],
        architecture: [
            "하드웨어 장비별 어댑터 패턴으로 QR/NFC/CARD 프로토콜 추상화",
            "실시간 출입 이벤트 → SNS → DynamoDB Stream 비동기 파이프라인",
            "MySQL 출입 이력(장기) + DynamoDB 세션 상태(실시간) 이중 저장 구조",
            "ACL 기반 권한 계층: 입주민·관리자·관제센터 역할별 접근 분리",
        ],
        challenges: [
            "네트워크 단절 시 오프라인 출입 이벤트 캐싱 후 재연결 시 순서 보장 동기화",
            "출입 기록 100만 건 이상 누적 시 페이지네이션 쿼리 성능 저하 → 인덱스 재설계",
            "다종 하드웨어 장비 응답 지연 차이로 인한 타임아웃 정책 장비별 분기 설계",
        ],
        metrics: [
            { label: "장비 연동", value: "5종+" },
            { label: "일 출입 처리", value: "2만+" },
            { label: "응답 속도", value: "< 200ms" },
        ],
        outcome: [
            "출입·주차 제어 안정화 및 로그 기반 BI 분석 체계 구축 완료",
            "MySQL 연동 및 정기 백업 자동화로 데이터 유실 리스크 제거",
            "어댑터 패턴 도입으로 신규 하드웨어 장비 추가 비용 최소화",
        ],
        problemSolving: [
            {
                problem:
                    "IoT 장비 네트워크 불안정으로 출입 이벤트 버스트 후 순서 역전 발생 → BI 데이터 오염",
                approach:
                    "이벤트 소싱 관점 접근 → 장비별 로컬 시퀀스 번호 부여, 서버에서 정렬 후 upsert 처리 방식 검토",
                solution:
                    "장비별 seq 번호 + timestamp 복합 정렬 키 설계, 멱등 upsert로 중복 방지 → 순서 보장 분석데이터 확보",
            },
            {
                problem: "장비 종류마다 연결 timeout이 달라 Controller에 timeout 분기 조건문 증가",
                approach:
                    "하드웨어 종류별 특성을 구성으로 분리 → Adapter 패턴으로 장비별 timeout·응답 포맷 정책 일괄 종속 검토",
                solution:
                    "장비별 Adapter 안에 timeout 정책 정의 → 코어 컨트롤러 업스트림 오염 없이 신규 장비 완전 독립 대응",
            },
        ],
    },
    {
        id: 4,
        title: "터미널 플랫폼 · 운영정책 고도화",
        company: "에스엘플랫폼",
        period: "2025.01 - 2025.09",
        role: "백엔드 설계·개발 · 운영정책 모듈화 · 마이크로서비스 구조 설계",
        description: "키오스크/포스·QR 주문 처리, 영수증 발급, 배송·예약·회원 정책 API 고도화",
        icon: ShoppingCart,
        color: "from-orange-500 to-red-500",
        tags: ["TypeScript", "Node.js", "DynamoDB", "SNS/SQS", "REST API"],
        highlights: [
            "키오스크/포스 결제, 바코드·QR 주문 처리, 영수증 발급 시스템 구현",
            "세대 단위 비용 조회, PG/관리비 결제 및 단말기 타입(O타입/보타닉) 대응",
            "배송/구매 제한 정책, 예약 관리·자동연장·우선예약·월권 자동연장 구현",
            "회원 정책 (탈퇴·퇴거·정지/삭제), 좌석·퇴거·이용내역 취소 API 설계",
        ],
        architecture: [
            "단말기 타입 Enum + Strategy Pattern으로 O타입/보타닉 분기 완전 제거",
            "바코드·QR 파싱 후 공통 주문 파이프라인 진입으로 처리 흐름 단일화",
            "영수증 발급 이벤트 → SNS Topic → Printer Lambda 비동기 연결",
            "정책 항목별 독립 모듈화로 마이크로서비스 구조에서 독립 배포 가능하게 설계",
        ],
        challenges: [
            "구형 단말기 API 응답 포맷 비표준 → Transformer 레이어로 공통 모델 정규화",
            "오프라인 단말기 재기동 시 미처리 주문 복구 로직 및 중복 처리 방지",
            "운영 정책 항목 급증에 따른 API 분기 복잡도 → 정책별 독립 모듈 분리",
        ],
        metrics: [
            { label: "단말기 타입", value: "2종+" },
            { label: "일 주문 처리", value: "1만+" },
            { label: "영수증 성공률", value: "99.8%" },
        ],
        outcome: [
            "마이크로서비스 기반 결제·터미널 시스템 구현 완료",
            "운영 정책 API 구조 최적화로 신규 정책 추가 공수 대폭 감소",
            "데이터 조회 최적화 및 단말기 확장 구조 완성",
        ],
        problemSolving: [
            {
                problem:
                    "O타입·보타닉 단말기 API 응답 포맷이 달라 결제 로직에 if-else 분기 20개 이상 누적",
                approach:
                    "OCP(개방-폐쇄 원칙) 위반 확인 → Strategy + Adapter 패턴으로 단말기 추상화 레이어 도입 검토",
                solution:
                    "공통 단말기 인터페이스 정의 후 타입별 Adapter 구현 → 분기 코드 완전 제거, 신규 단말기는 Adapter만 추가",
            },
            {
                problem:
                    "오프라인 단말기 재기동 후 동일 주문이 재전송되어 이중 결제 및 영수증 중복 발급",
                approach:
                    "단말기 상태 기점(offline/online)별 주문 상태를 명시적으로 관리 → 재기동 시 PENDING 상태 주문 확인 후 재시도",
                solution:
                    "주문 ID별 멱등 처리로 재전송 시 PENDING 주문 이어서 처리, 완료 주문 재시도는 결과만 반환",
            },
        ],
    },
    {
        id: 5,
        title: "글로벌 · AI · BI · QR오더",
        company: "에스엘플랫폼",
        period: "2025.04 - 2025.12",
        role: "백엔드 설계·구현 · 모듈화·서비스 통합",
        description:
            "QR/NFC 출입 통합 ACL, AI 챗봇, BI 대시보드, 글로벌 다국어 API, 무인 QR오더 풀스택 통합",
        icon: Globe,
        color: "from-teal-500 to-cyan-500",
        tags: ["TypeScript", "Node.js", "DynamoDB", "Elasticsearch", "i18n", "ChatGPT API"],
        highlights: [
            "QR/NFC/CARD 출입·주차 시스템 통합 ACL·권한 관리 고도화",
            "단지별 AI 챗봇 구축 (ChatGPT API 연동, FAQ 도메인 바인딩)",
            "BI 대시보드 구축 및 Elasticsearch 기반 분석 데이터 파이프라인",
            "글로벌 앱 다국어 API 설계 및 국내·해외 무인 QR오더 서비스 백엔드 구현",
        ],
        architecture: [
            "Accept-Language 헤더 기반 동적 i18n 응답 캐싱 레이어 설계",
            "ChatGPT Function Calling으로 단지 FAQ 도메인 바인딩 및 할루시네이션 방지",
            "Elasticsearch aggregation으로 BI 대시보드용 실시간 집계 API 구성",
            "ACL 권한 계층을 Proxy 패턴으로 추상화해 출입·주차·서비스 전역 통합 적용",
        ],
        challenges: [
            "국가별 세금·통화 포맷 차이 → 플러그인 방식 Chain of Responsibility 추상화",
            "AI 챗봇 hallucination → 단지별 FAQ 문서 기반 RAG 파이프라인 설계",
            "글로벌 QR오더 요청 급증 시 Lambda cold start 지연 → 프로비저닝 및 캐싱 전략",
        ],
        metrics: [
            { label: "지원 언어", value: "4개국어" },
            { label: "챗봇 연동 단지", value: "10+" },
            { label: "QR오더 국가", value: "2개국" },
        ],
        outcome: [
            "마이크로서비스 기반 통합 백엔드 구축 완료 (글로벌·AI·하드웨어 연동)",
            "국내·해외 무인 QR오더 서비스 성공적 배포",
            "AI 챗봇 도입으로 입주민 FAQ 대응 자동화 및 운영 부담 경감",
        ],
        problemSolving: [
            {
                problem: "AI 챗봇이 단지 규정과 다른 일반적인 ChatGPT 답변 생성 → 입주민 민원 발생",
                approach:
                    "LLM hallucination의 원인을 컨텍스트 부재로 파악 → RAG 패턴으로 단지별 FAQ를 컨텍스트로 주입하는 방식 검토",
                solution:
                    "단지 FAQ를 벡터 임베딩 후 질의 유사도 검색, 관련 문서를 System Prompt에 주입 → 도메인 특화 답변 유도",
            },
            {
                problem:
                    "글로벌 QR오더 요청 급증 시 Lambda cold start로 일시적 응답 지연 및 사용자 이탈",
                approach:
                    "Serverless cold start 특성 분석 → 주문 메타데이터 캐싱으로 디펜던시 주입 제거, 핵심 함수 프로비저닝 적용 검토",
                solution:
                    "제품·세율 데이터 Lambda 내부 캐싱 + 핵심 함수 Provisioned Concurrency 적용 → cold start 95% 감소",
            },
        ],
    },
    {
        id: 6,
        title: "ESP32-CAM IoT 시스템",
        company: "개인 프로젝트",
        period: "2026.02",
        role: "풀스택 설계·개발 (Firmware · Java Server · Python AI · React Client)",
        description:
            "ESP32-CAM 기반 실시간 영상 스트리밍, Race Condition 방지, AI 모션 감지 풀스택 구현",
        icon: MessageSquare,
        color: "from-primary-500 to-blue-500",
        tags: ["Java", "WebSocket", "ESP32", "Python", "Docker", "React", "AI"],
        highlights: [
            "WebSocket 기반 실시간 양방향 통신 및 다중 시청자 브로드캐스트",
            "Java Semaphore/AtomicReference로 다수 클라이언트 동시 제어권 충돌 방지",
            "Python AI Analyzer가 프레임 분석 후 BoundingBox를 역방향으로 Canvas에 오버레이",
            "Git pre-commit Hook 기반 자동 버전 bump 및 DuckDNS + SSL 프로덕션 배포",
        ],
        link: "https://github.com/SimSimEEE/esp32-camera-streaming",
        architecture: [
            "ESP32-CAM → Java WebSocket Server → React Client 3-tier 풀스택",
            "Java Semaphore로 제어 요청 직렬화, AtomicReference로 제어권 원자 교체",
            "Python AI Analyzer: 프레임 구독 → 분석 → BoundingBox JSON 역방향 push",
            "Docker Compose로 Java 서버·Python AI·Nginx 단일 EC2 운영",
        ],
        challenges: [
            "다수 클라이언트 동시 LED/Servo 제어 시 Race Condition 재현 및 Semaphore 방지 설계",
            "AI 분석 결과를 프레임 딜레이 없이 Canvas에 합성하는 타이밍 동기화",
            "Git Hook 기반 자동 버전 관리 → VERSION.md → 서버·클라이언트 API로 동기화",
        ],
        metrics: [
            { label: "스트리밍 지연", value: "< 200ms" },
            { label: "동시 시청자", value: "무제한" },
            { label: "AI 감지", value: "실시간" },
        ],
        outcome: [
            "백엔드 역량을 하드웨어·AI·인프라까지 확장한 풀스택 토이 프로젝트 완성",
            "동시성 제어(Race Condition) 문제를 직접 설계·검증한 실무형 경험",
            "EC2 + DuckDNS + SSL 기반 프로덕션 환경에 실제 서비스 중",
        ],
        problemSolving: [
            {
                problem:
                    "클라이언트 3개가 동시에 LED ON/OFF 요청 시 하드웨어가 중간 상태로 멈추거나 명령 소실",
                approach:
                    "임계 구역(Critical Section) 문제로 정의 → Java 동시성 도구 중 단일 진입 보장 방법으로 Semaphore 검토",
                solution:
                    "Semaphore(1)로 제어 요청 직렬화, AtomicReference로 현재 제어권 보유자를 원자적 갱신 → Race Condition 완전 차단",
            },
            {
                problem:
                    "Python AI 분석 결과(BoundingBox)가 프레임보다 늦게 도착하면 Canvas가 덜컥이고, 빠르면 반쯤 해제",
                approach:
                    "분석 딜레이와 프레임 딜레이를 통합 관리 → 오버레이를 프레임마다 갱신하지 않고 TTL 기반 유지 방식 검토",
                solution:
                    "받은 BoundingBox에 expiresAt 타임스탬프 부여, Canvas 매 프레임에서 TTL 검사 후 만료 시에만 제거 → 진동 제거",
            },
        ],
    },
];

export const ProjectCards = () => {
    const [activePanelId, setActivePanelId] = useState<number | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const togglePanel = (id: number) => {
        // ESP32-CAM IoT 시스템(id=6)을 클릭하면 IoTDashboard로 이동
        if (id === 6) {
            window.location.hash = "#iot-project";
            return;
        }
        setActivePanelId((prev) => (prev === id ? null : id));
    };

    const activeProject = projects.find((p) => p.id === activePanelId) ?? null;

    // 패널 열릴 때 스크롤
    useEffect(() => {
        if (activePanelId !== null && panelRef.current) {
            setTimeout(() => {
                panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }, [activePanelId]);

    return (
        <section id="projects" className="section-container bg-gray-950">
            <h2 className="section-title">
                Projects & <span className="text-primary-400">Systems</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => {
                    const Icon = project.icon;
                    const isActive = activePanelId === project.id;
                    const isGithubLink = project.link?.includes("github.com");

                    return (
                        <div
                            key={project.id}
                            onClick={() => togglePanel(project.id)}
                            className={`card flex flex-col transition-all duration-300 cursor-pointer ${
                                isActive
                                    ? "ring-1 ring-primary-500/50 shadow-lg shadow-primary-900/20"
                                    : "hover:scale-[1.02]"
                            }`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className={`relative group p-3 bg-gradient-to-br ${project.color} rounded-lg transition-all`}
                                >
                                    <Icon className="w-6 h-6 text-white" />
                                    <Play className="absolute -bottom-1 -right-1 w-3 h-3 text-white fill-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                                {project.link && (
                                    <a
                                        href={project.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                                        title={isGithubLink ? "GitHub Repository" : "외부 링크"}
                                    >
                                        {isGithubLink ? (
                                            <Github className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                                        ) : (
                                            <ExternalLink className="w-4 h-4 text-gray-500 hover:text-primary-400" />
                                        )}
                                    </a>
                                )}
                            </div>

                            {/* Title & Company */}
                            <h3 className="text-3xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-primary-300 transition-colors">
                                {project.title}
                            </h3>
                            <p className="text-lg text-primary-100 font-bold mb-1 bg-gradient-to-r from-primary-900/40 to-transparent px-3 py-1 rounded inline-block">
                                {project.company}
                            </p>
                            <p className="text-base text-gray-400 mb-2">{project.period}</p>
                            {/* Role */}
                            <div className="flex items-start gap-1.5 mb-4 bg-gray-800/50 px-3 py-2 rounded-lg border border-primary-500/30">
                                <UserCog className="w-4 h-4 text-primary-300 mt-0.5 shrink-0 font-bold" />
                                <p className="text-base text-primary-200 font-bold leading-relaxed">
                                    {project.role}
                                </p>
                            </div>

                            {/* Description */}
                            <p className="text-base text-gray-300 mb-4">{project.description}</p>

                            {/* Highlights */}
                            <ul className="space-y-2 mb-4">
                                {project.highlights.map((highlight, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-2 text-base text-gray-300"
                                    >
                                        <span className="text-primary-400 mt-0.5 font-bold">▸</span>
                                        <span>{highlight}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mt-auto mb-3">
                                {project.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2.5 py-1 bg-gray-800/70 text-cyan-300 text-sm font-semibold rounded-full border border-gray-700/80"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Click hint */}
                            <p
                                className={`text-center text-[10px] transition-colors ${
                                    isActive ? "text-primary-500" : "text-gray-700"
                                }`}
                            >
                                {isActive ? "▲ 패널 닫기" : project.id === 6 ? "클릭 → IoT 데모 이동" : "클릭 → 상세 / 데모"}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* ─── Bottom Detail / Demo Panel ─── */}
            {activeProject && (
                <div
                    ref={panelRef}
                    className="mt-10 rounded-2xl border border-primary-800/40 bg-gray-900/60 overflow-hidden shadow-2xl shadow-primary-950/40"
                >
                    {/* Panel Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
                        <div className="flex items-center gap-3">
                            <div
                                className={`p-2 bg-gradient-to-br ${activeProject.color} rounded-lg shrink-0`}
                            >
                                {(() => {
                                    const PanelIcon = activeProject.icon;
                                    return <PanelIcon className="w-5 h-5 text-white" />;
                                })()}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-100">{activeProject.title}</h3>
                                <p className="text-xs text-gray-500">
                                    {activeProject.company} · {activeProject.period}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setActivePanelId(null)}
                            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-500 hover:text-gray-200"
                            title="닫기"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Panel Body */}
                    {activeProject.id === 6 ? (
                        /* IoT 프로젝트: 실제 라이브 데모 */
                        <div className="p-0">
                            <CameraViewer />
                        </div>
                    ) : (
                        /* 나머지 프로젝트: 상세 정보 */
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Metrics */}
                            {activeProject.metrics && activeProject.metrics.length > 0 && (
                                <div className="md:col-span-2">
                                    <h4 className="flex items-center gap-1.5 text-base font-bold text-primary-200 mb-3 uppercase tracking-wider">
                                        <BarChart2 className="w-5 h-5 text-primary-300" />
                                        핵심 지표
                                    </h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        {activeProject.metrics.map((m, i) => (
                                            <div
                                                key={i}
                                                className="bg-gradient-to-br from-primary-900/50 to-cyan-900/30 rounded-xl p-4 text-center border-2 border-primary-500/50 shadow-lg shadow-primary-900/30"
                                            >
                                                <p className="text-primary-100 font-black text-3xl">
                                                    {m.value}
                                                </p>
                                                <p className="text-primary-300 text-sm mt-1 font-semibold">
                                                    {m.label}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Architecture */}
                            {activeProject.architecture &&
                                activeProject.architecture.length > 0 && (
                                    <div>
                                        <h4 className="flex items-center gap-1.5 text-sm font-bold mb-2 uppercase tracking-wider">
                                            <Layers className="w-4 h-4 text-cyan-400" />
                                            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Architecture</span>
                                        </h4>
                                        <ul className="space-y-2">
                                            {activeProject.architecture.map((item, i) => (
                                                <li
                                                    key={i}
                                                    className="flex items-start gap-2 text-xs text-gray-500"
                                                >
                                                    <span className="text-cyan-600 mt-0.5 shrink-0">
                                                        ◆
                                                    </span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                            {/* Challenges */}
                            {activeProject.challenges && activeProject.challenges.length > 0 && (
                                <div>
                                    <h4 className="flex items-center gap-1.5 text-sm font-bold mb-2 uppercase tracking-wider">
                                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                                        <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Technical Challenges</span>
                                    </h4>
                                    <ul className="space-y-2">
                                        {activeProject.challenges.map((item, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2 text-xs text-gray-500"
                                            >
                                                <span className="text-amber-600 mt-0.5 shrink-0">
                                                    !
                                                </span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Outcome */}
                            {activeProject.outcome && activeProject.outcome.length > 0 && (
                                <div>
                                    <h4 className="flex items-center gap-1.5 text-sm font-bold mb-2 uppercase tracking-wider">
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                        <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Outcome</span>
                                    </h4>
                                    <ul className="space-y-2">
                                        {activeProject.outcome.map((item, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start gap-2 text-xs text-gray-500"
                                            >
                                                <span className="text-green-600 mt-0.5 shrink-0">
                                                    ✓
                                                </span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Problem Solving */}
                            {activeProject.problemSolving &&
                                activeProject.problemSolving.length > 0 && (
                                    <div className="md:col-span-2">
                                        <h4 className="flex items-center gap-1.5 text-sm font-bold mb-3 uppercase tracking-wider">
                                            <Lightbulb className="w-4 h-4 text-yellow-400" />
                                            <span className="bg-gradient-to-r from-yellow-400 to-amber-400 bg-clip-text text-transparent">Problem Solving</span>
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {activeProject.problemSolving.map((ps, i) => (
                                                <div
                                                    key={i}
                                                    className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden"
                                                >
                                                    <div className="flex items-start gap-2 px-3 py-2 border-b border-gray-800">
                                                        <span className="shrink-0 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-900/50 text-red-400 border border-red-800/50">
                                                            문제
                                                        </span>
                                                        <p className="text-xs text-gray-400 leading-relaxed">
                                                            {ps.problem}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-start gap-2 px-3 py-2 border-b border-gray-800">
                                                        <span className="shrink-0 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-400 border border-blue-800/50">
                                                            접근
                                                        </span>
                                                        <p className="text-xs text-gray-500 leading-relaxed">
                                                            {ps.approach}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-start gap-2 px-3 py-2">
                                                        <span className="shrink-0 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-900/50 text-green-400 border border-green-800/50">
                                                            해결
                                                        </span>
                                                        <p className="text-xs text-gray-500 leading-relaxed">
                                                            {ps.solution}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}
                </div>
            )}
        </section>
    );
};
