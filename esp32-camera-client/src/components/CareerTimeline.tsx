/**
 * `CareerTimeline.tsx`
 * - Career evolution timeline from electrical engineering to MSA backend
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { useState } from "react";
import { Zap, Code, Server, ChevronDown, ChevronUp, Tag, Camera } from "lucide-react";

interface Milestone {
    id: number;
    phase: string;
    period: string;
    title: string;
    company: string;
    description: string;
    icon: typeof Zap;
    highlights: string[];
    color: string;
    // 확장 영역
    techUsed?: string[];
    impact?: string[];
}

const milestones: Milestone[] = [
    {
        id: 1,
        phase: "The Foundation",
        period: "2021.04 - 2023.04",
        title: "전기설계 엔지니어",
        company: "한국가스기술공사",
        description: "거대 시스템의 정밀한 도면 설계 경험",
        icon: Zap,
        highlights: [
            "통영 LNG 터미널 전기설계 업무 100% 완수",
            "울산북항 항만배후부지 전기설계 업무",
            "협력사 일정 조율 및 기한 관리 경험",
            "체계적 인수인계 및 업무 효율화 중요성 습득",
        ],
        color: "from-amber-500 to-orange-500",
        techUsed: ["AutoCAD", "E3.series", "MS Project", "저압/고압 배전 설계"],
        impact: [
            "대형 국책 인프라 프로젝트에서 시스템 전체 도면 완성 체계를 체득",
            "협력사 10개사 이상 일정 병렬 조율 경험 축적",
            "주당 40h 이상 CAD 작업 효율화 도구 자체 개발",
        ],
    },
    {
        id: 2,
        phase: "The Expansion",
        period: "2023.07 - 2023.08",
        title: "SW-AI Lab 부트캠프",
        company: "크래프톤정글 2기",
        description: "하드웨어 로직을 소프트웨어 알고리즘으로 치환 — 도메인 확장",
        icon: Code,
        highlights: [
            "동시 편집 협업툴 개발 (백엔드/프론트엔드)",
            "ChatGPT API 기반 아이디어 제안 기능 구현",
            "UI/UX 개선 및 실시간 트래킹 기능 구현",
            "15개 협력사 앞 최종 시연 및 질의응답",
        ],
        color: "from-cyan-500 to-blue-500",
        techUsed: ["Python", "Flask", "React.js", "WebSocket", "ChatGPT API", "PostgreSQL"],
        impact: [
            "실시간 동시 편집 관리 복잡도 해결 → 충돌 처리 로직 직접 설계",
            "AI 제안 기능 사용자 만족도 평가 시연 현장에서 긍정적 피드백",
            "부트캠프를 통한 소프트웨어 도메인으로의 커리어 확장 완료",
        ],
    },
    {
        id: 3,
        phase: "The Architecture",
        period: "2023.12 - Present",
        title: "MSA 백엔드 개발자",
        company: "에스엘플랫폼",
        description: "결제·출입·보안 MSA 설계 및 운영",
        icon: Server,
        highlights: [
            "마이크로서비스 기반 백엔드 아키텍처 설계",
            "AWS Lambda, DynamoDB, Elasticsearch 활용",
            "결제·정산·출입·보안 시스템 구현",
            "CI/CD 파이프라인 경험 (GitHub Actions, Travis CI)",
        ],
        color: "from-primary-500 to-teal-500",
        techUsed: [
            "TypeScript",
            "Node.js",
            "AWS Lambda",
            "DynamoDB",
            "Elasticsearch",
            "MySQL",
            "Docker",
            "GitHub Actions",
        ],
        impact: [
            "시스템 분리 및 책임 분산으로 장애 영향 범위 축소 → 서비스별 독립 배포 구성 완료",
            "5개 이상 독립 도메인 (결제·정산·출입·보안·터미널) 동시 운영",
            "단일 표준 아키텍처 템플릿으로 신규 서비스 온보딩 속도 향상",
        ],
    },
    {
        id: 4,
        phase: "The Innovation",
        period: "2026.02 - Present",
        title: "풀스택 IoT 프로젝트",
        company: "개인 프로젝트",
        description: "백엔드 역량을 하드웨어·AI·인프라까지 확장 — 전방위 성장",
        icon: Camera,
        highlights: [
            "ESP32-CAM 실시간 스트리밍 풀스택 구현",
            "Java Semaphore/AtomicReference로 Race Condition 해결",
            "Python AI 모션 감지 및 실시간 Canvas 오버레이",
            "Docker Compose 기반 프로덕션 서비스 운영",
        ],
        color: "from-primary-500 to-cyan-500",
        techUsed: ["Java", "WebSocket", "ESP32-CAM", "Python AI", "Docker", "React", "DuckDNS + SSL"],
        impact: [
            "하드웨어·펌웨어·서버·AI·프론트엔드까지 전 영역 설계 및 구현 완료",
            "동시성 제어(Race Condition) 문제를 직접 재현하고 Semaphore로 해결한 실전형 경험",
            "EC2 + DuckDNS + SSL 환경에서 실제 프로덕션 서비스 중",
        ],
    },
];

export const CareerTimeline = () => {
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const toggleExpand = (id: number) => {
        setExpandedId((prev) => (prev === id ? null : id));
    };

    return (
        <section id="career" className="section-container bg-gray-950">
            <h2 className="section-title">
                Career <span className="text-primary-400">Evolution</span>
            </h2>

            <div className="max-w-4xl mx-auto">
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 md:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 via-cyan-500 to-primary-500"></div>

                    {/* Timeline Items */}
                    {milestones.map((milestone) => {
                        const Icon = milestone.icon;
                        const isExpanded = expandedId === milestone.id;
                        const hasDetail =
                            (milestone.techUsed?.length ?? 0) > 0 ||
                            (milestone.impact?.length ?? 0) > 0;

                        return (
                            <div key={milestone.id} className="relative mb-16 md:mb-24">
                                {/* Icon Circle */}
                                <div className="absolute left-8 md:left-8 -translate-x-1/2 w-16 h-16 rounded-full bg-gray-950 border-4 border-gray-800 flex items-center justify-center z-10">
                                    <div
                                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${milestone.color} flex items-center justify-center`}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* Content Card */}
                                <div className="ml-24 md:ml-24">
                                    <div
                                        className={`card hover:shadow-xl hover:shadow-primary-900/20 transition-all duration-300 ${
                                            isExpanded ? "ring-1 ring-primary-500/40" : ""
                                        }`}
                                    >
                                        {/* Phase Badge */}
                                        <div className="mb-4">
                                            <span
                                                className={`inline-block px-4 py-1.5 bg-gradient-to-r ${milestone.color} text-white text-sm font-bold rounded-lg shadow-lg shadow-black/40 border border-white/20`}
                                            >
                                                {milestone.phase}
                                            </span>
                                        </div>

                                        {/* Period */}
                                        <p className="text-base text-gray-500 mb-2">
                                            {milestone.period}
                                        </p>

                                        {/* Title & Company */}
                                        <h3 className="text-4xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-200">
                                            {milestone.title}
                                        </h3>
                                        <p className="text-xl text-primary-200 font-bold mb-3 bg-primary-900/30 inline-block px-3 py-1 rounded-lg">
                                            {milestone.company}
                                        </p>

                                        {/* Description */}
                                        <p className="text-base text-gray-300 mb-4">
                                            {milestone.description}
                                        </p>

                                        {/* Highlights */}
                                        <ul className="space-y-2">
                                            {milestone.highlights.map((highlight, idx) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-start gap-2 text-base text-gray-400"
                                                >
                                                    <span className="text-primary-500 mt-1">▸</span>
                                                    <span>{highlight}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        {/* Expandable Section */}
                                        {hasDetail && (
                                            <>
                                                <button
                                                    onClick={() => toggleExpand(milestone.id)}
                                                    className="mt-4 flex items-center justify-center gap-1 w-full py-2 text-xs text-gray-500 hover:text-primary-400 border-t border-gray-800 hover:border-primary-800 transition-colors"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <ChevronUp className="w-3.5 h-3.5" />
                                                            접기
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                            사용 기술 · 성과 보기
                                                        </>
                                                    )}
                                                </button>

                                                <div
                                                    className={`overflow-hidden transition-all duration-300 ${
                                                        isExpanded
                                                            ? "max-h-80 opacity-100 mt-4"
                                                            : "max-h-0 opacity-0"
                                                    }`}
                                                >
                                                    {/* Tech Used */}
                                                    {milestone.techUsed &&
                                                        milestone.techUsed.length > 0 && (
                                                            <div className="mb-4">
                                                                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                                                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                                                                    Tech Used
                                                                </h4>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {milestone.techUsed.map(
                                                                        (tech) => (
                                                                            <span
                                                                                key={tech}
                                                                                className="px-2 py-0.5 bg-gray-800 text-cyan-300 text-sm font-semibold rounded-md border border-gray-700"
                                                                            >
                                                                                {tech}
                                                                            </span>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                    {/* Impact */}
                                                    {milestone.impact &&
                                                        milestone.impact.length > 0 && (
                                                            <div>
                                                                <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                                                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                                                                    Impact
                                                                </h4>
                                                                <ul className="space-y-1.5">
                                                                    {milestone.impact.map(
                                                                        (item, i) => (
                                                                            <li
                                                                                key={i}
                                                                                className="flex items-start gap-2 text-sm text-gray-400"
                                                                            >
                                                                                <span className="text-amber-500 mt-0.5 shrink-0 font-bold">
                                                                                    ★
                                                                                </span>
                                                                                <span>{item}</span>
                                                                            </li>
                                                                        ),
                                                                    )}
                                                                </ul>
                                                            </div>
                                                        )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Connection to IoT Dashboard */}
                    <div className="relative mb-0">
                        {/* Vertical Line Extension */}
                        <div className="absolute left-8 md:left-8 top-0 h-24 w-0.5 bg-gradient-to-b from-primary-500 via-cyan-500 to-transparent"></div>
                        
                        {/* Connection Text */}
                        <div className="relative ml-24 md:ml-24 mt-12 flex items-center gap-3 text-cyan-400">
                            <div className="h-px flex-1 bg-gradient-to-r from-cyan-500/50 to-transparent"></div>
                            <span className="text-sm font-semibold tracking-wider">▼ Live Demo Below</span>
                            <div className="h-px flex-1 bg-gradient-to-l from-cyan-500/50 to-transparent"></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
