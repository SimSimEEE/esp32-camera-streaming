/**
 * `ProjectCards.tsx`
 * - Project showcase cards with expandable detail depth
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { useState } from "react";
import {
    ShoppingCart,
    CreditCard,
    Shield,
    Settings,
    Globe,
    MessageSquare,
    Github,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    Layers,
    AlertTriangle,
    BarChart2,
} from "lucide-react";

interface Metric {
    label: string;
    value: string;
}

interface Project {
    id: number;
    title: string;
    company: string;
    period: string;
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
}

const projects: Project[] = [
    {
        id: 1,
        title: "운영·관리 시스템",
        company: "에스엘플랫폼",
        period: "2024.01 - 2024.12",
        description: "회원·세대 관리, 예약 및 이용내역 기록, 통계·대시보드 기능",
        icon: Settings,
        color: "from-blue-500 to-cyan-500",
        tags: ["TypeScript", "Node.js", "DynamoDB", "REST API"],
        highlights: [
            "단지 단위 요금 계산 및 정산 시스템",
            "내부 어드민용 통계·대시보드",
            "좌석/이용내역 취소 및 권한별 접근 제어",
        ],
        architecture: [
            "멀티 테넌트 DynamoDB 파티션 키 전략으로 단지별 데이터 격리",
            "Lambda 이벤트 기반 비동기 처리로 통계 집계 분리",
            "Service-Proxy-Manager 레이어드 아키텍처 적용",
        ],
        challenges: [
            "세대 수 증가에 따른 페이지네이션 성능 최적화 (GSI 재설계)",
            "어드민·세대원·관리자 3단계 ACL 권한 모델 설계",
        ],
        metrics: [
            { label: "적용 단지", value: "30+" },
            { label: "API 엔드포인트", value: "120+" },
            { label: "월 처리 건수", value: "50만+" },
        ],
    },
    {
        id: 2,
        title: "결제·정산 시스템",
        company: "에스엘플랫폼",
        period: "2024.03 - 2024.11",
        description: "PG사 연동, 결제 처리, 세대별 관리비/추가비용 정산",
        icon: CreditCard,
        color: "from-green-500 to-emerald-500",
        tags: ["TypeScript", "DynamoDB", "Elasticsearch", "PG API"],
        highlights: [
            "단말기 연동 키오스크/포스 결제",
            "PG사 연동 및 웹훅 처리",
            "결제 안정성 확보 및 정산 속도 개선",
        ],
        architecture: [
            "Idempotency Key 기반 중복 결제 방지 레이어",
            "웹훅 수신 후 SQS 큐잉으로 비동기 정산 처리",
            "Elasticsearch 기반 결제 이력 전문 검색 인덱싱",
        ],
        challenges: [
            "PG사 통신 타임아웃 시 상태 불일치 해소 (보상 트랜잭션)",
            "정산 배치 처리 시 DynamoDB 쓰로틀링 회피 전략",
        ],
        metrics: [
            { label: "정산 정확도", value: "99.9%" },
            { label: "결제 처리 속도", value: "↑ 40%" },
            { label: "연동 PG사", value: "3개사" },
        ],
    },
    {
        id: 3,
        title: "출입·보안 시스템",
        company: "에스엘플랫폼",
        period: "2024.06 - 2024.12",
        description: "QR/NFC/CARD 출입 제어, 주차 관제 연동, 권한별 접근 제어",
        icon: Shield,
        color: "from-purple-500 to-pink-500",
        tags: ["TypeScript", "MySQL", "DynamoDB", "ACL"],
        highlights: [
            "QR/NFC/CARD 출입 제어 시스템",
            "주차 관제 시스템 연동",
            "출입·주차 기록 기반 BI 분석",
        ],
        architecture: [
            "하드웨어 장비별 프로토콜 어댑터 패턴 (QR/NFC/CARD 추상화)",
            "실시간 출입 이벤트 → Kinesis → DynamoDB Stream 파이프라인",
            "MySQL 출입 이력 + DynamoDB 세션 상태 이중 저장 구조",
        ],
        challenges: [
            "네트워크 단절 시 오프라인 출입 캐싱 후 재연결 동기화",
            "출입 기록 100만 건 이상 페이지네이션 쿼리 최적화",
        ],
        metrics: [
            { label: "장비 연동", value: "5종+" },
            { label: "일 출입 처리", value: "2만+" },
            { label: "응답 속도", value: "< 200ms" },
        ],
    },
    {
        id: 4,
        title: "터미널 플랫폼",
        company: "에스엘플랫폼",
        period: "2025.01 - 2025.09",
        description: "키오스크/포스 결제, 바코드·QR 주문 처리, 영수증 발급",
        icon: ShoppingCart,
        color: "from-orange-500 to-red-500",
        tags: ["TypeScript", "REST API", "DynamoDB", "Payment"],
        highlights: [
            "세대 단위 비용 조회",
            "PG/관리비 결제 처리",
            "단말기 타입별 대응 (O타입/보타닉)",
        ],
        architecture: [
            "단말기 타입 Enum 기반 Strategy Pattern으로 분기 제거",
            "바코드·QR 파싱 후 공통 주문 파이프라인 통과",
            "영수증 발급 이벤트 → SNS Topic 발행 → Printer Lambda",
        ],
        challenges: [
            "구형 단말기 API 응답 포맷 파싱 및 정규화",
            "오프라인 단말기 재기동 시 미처리 주문 복구 로직",
        ],
        metrics: [
            { label: "단말기 타입", value: "2종+" },
            { label: "일 주문 처리", value: "1만+" },
            { label: "영수증 성공률", value: "99.8%" },
        ],
    },
    {
        id: 5,
        title: "글로벌 서비스",
        company: "에스엘플랫폼",
        period: "2025.04 - 2025.12",
        description: "글로벌 앱 지원, 다국어 API 설계, AI 챗봇 연동",
        icon: Globe,
        color: "from-teal-500 to-cyan-500",
        tags: ["TypeScript", "REST API", "i18n", "AI"],
        highlights: [
            "글로벌 앱 다국어 API 설계",
            "국내·해외 무인 QR오더 서비스",
            "단지별 AI 챗봇 구축",
        ],
        architecture: [
            "Accept-Language 헤더 기반 동적 i18n 응답 캐싱 레이어",
            "ChatGPT Function Calling으로 단지 FAQ 도메인 바인딩",
            "지역별 CDN 분기 + 엣지 캐싱으로 글로벌 레이턴시 감소",
        ],
        challenges: [
            "국가별 세금·통화 포맷 차이를 플러그인 방식으로 추상화",
            "AI 챗봇 hallucination 방지를 위한 RAG 파이프라인 설계",
        ],
        metrics: [
            { label: "지원 언어", value: "4개국어" },
            { label: "챗봇 연동 단지", value: "10+" },
            { label: "QR오더 국가", value: "2개국" },
        ],
    },
    {
        id: 6,
        title: "ESP32-CAM IoT 시스템",
        company: "개인 프로젝트",
        period: "2026.02",
        description: "실시간 영상 스트리밍, WebSocket 통신, Race Condition 방지",
        icon: MessageSquare,
        color: "from-primary-500 to-blue-500",
        tags: ["Java", "WebSocket", "ESP32", "IoT", "Python", "AI"],
        highlights: [
            "WebSocket 기반 실시간 양방향 통신",
            "Semaphore/AtomicReference 기반 다중 제어권 충돌 방지",
            "Git Hook 기반 자동 버전 관리",
        ],
        link: "https://github.com/SimSimEEE/esp32-camera-streaming",
        architecture: [
            "ESP32-CAM Firmware → Java WebSocket Server → React 클라이언트 풀스택",
            "Java Semaphore로 동시 제어 요청 직렬화, AtomicReference로 제어권 원자 교체",
            "Python AI Analyzer가 프레임 구독·분석 후 BoundingBox JSON 역방향 push",
            "Git pre-commit Hook이 커밋 시 버전 파일 자동 bump",
        ],
        challenges: [
            "다수 클라이언트 동시 LED/Servo 제어 시 Race Condition 재현 및 방지",
            "AI 분석 결과 오버레이를 프레임 딜레이 없이 Canvas에 합성하는 타이밍 설계",
            "EC2에서 Java 서버·Python AI·Nginx을 Docker Compose로 단일 운영",
        ],
        metrics: [
            { label: "스트리밍 지연", value: "< 200ms" },
            { label: "동시 시청자", value: "무제한" },
            { label: "AI 감지", value: "실시간" },
        ],
    },
];

export const ProjectCards = () => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <section id="projects" className="section-container bg-gray-950">
            <h2 className="section-title">
                Projects & <span className="text-primary-400">Systems</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => {
                    const Icon = project.icon;
                    const isExpanded = expandedId === project.id;
                    const hasDetail =
                        (project.architecture?.length ?? 0) > 0 ||
                        (project.challenges?.length ?? 0) > 0 ||
                        (project.metrics?.length ?? 0) > 0;
                    const isGithubLink = project.link?.includes("github.com");

                    return (
                        <div
                            key={project.id}
                            className={`card flex flex-col transition-all duration-300 ${
                                isExpanded
                                    ? "ring-1 ring-primary-500/50 shadow-lg shadow-primary-900/20"
                                    : "hover:scale-[1.02]"
                            }`}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className={`p-3 bg-gradient-to-br ${project.color} rounded-lg`}
                                >
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                {project.link && (
                                    <a
                                        href={project.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
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
                            <h3 className="text-xl font-bold mb-2 transition-colors">
                                {project.title}
                            </h3>
                            <p className="text-sm text-primary-500 font-semibold mb-2">
                                {project.company}
                            </p>
                            <p className="text-xs text-gray-600 mb-4">{project.period}</p>

                            {/* Description */}
                            <p className="text-sm text-gray-400 mb-4">{project.description}</p>

                            {/* Highlights */}
                            <ul className="space-y-2 mb-4">
                                {project.highlights.map((highlight, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-2 text-xs text-gray-500"
                                    >
                                        <span className="text-primary-500 mt-0.5">▸</span>
                                        <span>{highlight}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2 mb-4">
                                {project.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-md"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Expandable Detail Section */}
                            {hasDetail && (
                                <>
                                    {/* Expand Toggle Button */}
                                    <button
                                        onClick={() => toggleExpand(project.id)}
                                        className="mt-auto flex items-center justify-center gap-1 w-full py-2 text-xs text-gray-500 hover:text-primary-400 border-t border-gray-800 hover:border-primary-800 transition-colors"
                                    >
                                        {isExpanded ? (
                                            <>
                                                <ChevronUp className="w-3.5 h-3.5" />
                                                접기
                                            </>
                                        ) : (
                                            <>
                                                <ChevronDown className="w-3.5 h-3.5" />
                                                자세히 보기
                                            </>
                                        )}
                                    </button>

                                    {/* Expanded Content */}
                                    <div
                                        className={`overflow-hidden transition-all duration-300 ${
                                            isExpanded
                                                ? "max-h-[600px] opacity-100 mt-4"
                                                : "max-h-0 opacity-0"
                                        }`}
                                    >
                                        {/* Metrics */}
                                        {project.metrics && project.metrics.length > 0 && (
                                            <div className="mb-4">
                                                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                                    <BarChart2 className="w-3.5 h-3.5 text-primary-400" />
                                                    Key Metrics
                                                </h4>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {project.metrics.map((m, i) => (
                                                        <div
                                                            key={i}
                                                            className="bg-gray-900 rounded-lg p-2 text-center border border-gray-800"
                                                        >
                                                            <p className="text-primary-400 font-bold text-sm">
                                                                {m.value}
                                                            </p>
                                                            <p className="text-gray-600 text-[10px] mt-0.5">
                                                                {m.label}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Architecture */}
                                        {project.architecture &&
                                            project.architecture.length > 0 && (
                                                <div className="mb-4">
                                                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                                                        Architecture
                                                    </h4>
                                                    <ul className="space-y-1.5">
                                                        {project.architecture.map((item, i) => (
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
                                        {project.challenges && project.challenges.length > 0 && (
                                            <div>
                                                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                                    Technical Challenges
                                                </h4>
                                                <ul className="space-y-1.5">
                                                    {project.challenges.map((item, i) => (
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
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
