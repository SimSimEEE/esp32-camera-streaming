/**
 * `ProjectCards.tsx`
 * - Project showcase cards with categorized systems
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import {
    ShoppingCart,
    CreditCard,
    Shield,
    Settings,
    Globe,
    MessageSquare,
    ExternalLink,
} from "lucide-react";

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
    },
    {
        id: 6,
        title: "ESP32-CAM IoT 시스템",
        company: "개인 프로젝트",
        period: "2026.02",
        description: "실시간 영상 스트리밍, WebSocket 통신, Race Condition 방지",
        icon: MessageSquare,
        color: "from-primary-500 to-blue-500",
        tags: ["Java", "WebSocket", "ESP32", "IoT"],
        highlights: [
            "WebSocket 기반 실시간 양방향 통신",
            "Semaphore/AtomicReference 기반 다중 제어권 충돌 방지",
            "Git Hook 기반 자동 버전 관리",
        ],
        link: "https://github.com/SimSimEEE/esp32-camera-streaming",
    },
];

export const ProjectCards = () => {
    return (
        <section id="projects" className="section-container bg-gray-950">
            <h2 className="section-title">
                Projects & <span className="text-primary-400">Systems</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => {
                    const Icon = project.icon;
                    return (
                        <div
                            key={project.id}
                            className="card group hover:scale-105 transition-transform duration-300"
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
                                    >
                                        <ExternalLink className="w-4 h-4 text-gray-500 hover:text-primary-400" />
                                    </a>
                                )}
                            </div>

                            {/* Title & Company */}
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary-400 transition-colors">
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
                            <div className="flex flex-wrap gap-2">
                                {project.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-md"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </section>
    );
};
