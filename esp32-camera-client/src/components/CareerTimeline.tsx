/**
 * `CareerTimeline.tsx`
 * - Career evolution timeline from electrical engineering to MSA backend
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { Zap, Code, Server } from "lucide-react";

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
    },
    {
        id: 2,
        phase: "The Transition",
        period: "2023.07 - 2023.08",
        title: "SW-AI Lab 부트캠프",
        company: "크래프톤정글 2기",
        description: "하드웨어 로직을 소프트웨어 알고리즘으로 치환",
        icon: Code,
        highlights: [
            "동시 편집 협업툴 개발 (백엔드/프론트엔드)",
            "ChatGPT API 기반 아이디어 제안 기능 구현",
            "UI/UX 개선 및 실시간 트래킹 기능 구현",
            "15개 협력사 앞 최종 시연 및 질의응답",
        ],
        color: "from-cyan-500 to-blue-500",
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
    },
];

export const CareerTimeline = () => {
    return (
        <section id="career" className="section-container bg-gray-950">
            <h2 className="section-title">
                Career <span className="text-primary-400">Evolution</span>
            </h2>

            <div className="max-w-4xl mx-auto">
                <div className="relative">
                    {/* Vertical Line */}
                    <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-500 via-cyan-500 to-primary-500"></div>

                    {/* Timeline Items */}
                    {milestones.map((milestone, index) => {
                        const Icon = milestone.icon;
                        const isEven = index % 2 === 0;

                        return (
                            <div
                                key={milestone.id}
                                className={`relative mb-16 md:mb-24 ${
                                    isEven ? "md:pr-1/2" : "md:pl-1/2"
                                }`}
                            >
                                {/* Icon Circle */}
                                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-gray-950 border-4 border-gray-800 flex items-center justify-center z-10">
                                    <div
                                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${milestone.color} flex items-center justify-center`}
                                    >
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                </div>

                                {/* Content Card */}
                                <div
                                    className={`ml-24 md:ml-0 ${isEven ? "md:mr-12" : "md:ml-12"}`}
                                >
                                    <div className="card group hover:shadow-xl hover:shadow-primary-900/20">
                                        {/* Phase Badge */}
                                        <div className="mb-4">
                                            <span
                                                className={`inline-block px-3 py-1 bg-gradient-to-r ${milestone.color} text-white text-xs font-bold rounded-full`}
                                            >
                                                {milestone.phase}
                                            </span>
                                        </div>

                                        {/* Period */}
                                        <p className="text-sm text-gray-500 mb-2">
                                            {milestone.period}
                                        </p>

                                        {/* Title & Company */}
                                        <h3 className="text-2xl font-bold mb-2 text-white group-hover:text-primary-400 transition-colors">
                                            {milestone.title}
                                        </h3>
                                        <p className="text-primary-400 font-semibold mb-3">
                                            {milestone.company}
                                        </p>

                                        {/* Description */}
                                        <p className="text-gray-400 mb-4">
                                            {milestone.description}
                                        </p>

                                        {/* Highlights */}
                                        <ul className="space-y-2">
                                            {milestone.highlights.map((highlight, idx) => (
                                                <li
                                                    key={idx}
                                                    className="flex items-start gap-2 text-sm text-gray-500"
                                                >
                                                    <span className="text-primary-500 mt-1">▸</span>
                                                    <span>{highlight}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
