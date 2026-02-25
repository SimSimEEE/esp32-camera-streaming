/**
 * `TechStack.tsx`
 * - Technology stack visualization with categorized skills
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { Code2, Database, Cloud, Layers, Settings, GitBranch } from "lucide-react";

interface Skill {
    name: string;
    grade: "A" | "B" | "C";
    detail: string;
    categoryDescription: string;
}

interface SkillCategory {
    category: string;
    icon: typeof Code2;
    skills: Skill[];
}

interface GradeMeta {
    title: string;
    definition: string;
    chipClassName: string;
    accentClassName: string;
    barClassName: string;
    score: number;
}

const gradeMeta: Record<Skill["grade"], GradeMeta> = {
    A: {
        title: "<span class='bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent'>아키텍트/리드</span>",
        definition:
            "시스템 <span class='font-bold text-emerald-300'>아키텍처 설계</span>, <span class='font-bold text-emerald-300'>성능 최적화</span>, 고난도 장애 대응 리딩이 가능한 수준입니다.",
        chipClassName: "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40",
        accentClassName: "text-emerald-300",
        barClassName: "bg-emerald-400",
        score: 95,
    },
    B: {
        title: "<span class='bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent'>스페셜리스트/시니어</span>",
        definition:
            "<span class='font-bold text-blue-300'>복잡한 비즈니스 로직</span>을 독립적으로 구현하고, <span class='font-bold text-blue-300'>베스트 프랙티스</span>를 실무에 적용할 수 있는 수준입니다.",
        chipClassName: "bg-blue-500/20 text-blue-300 border border-blue-400/40",
        accentClassName: "text-blue-300",
        barClassName: "bg-blue-400",
        score: 75,
    },
    C: {
        title: "<span class='bg-gradient-to-r from-slate-400 to-gray-300 bg-clip-text text-transparent'>실무형/운영 가능</span>",
        definition:
            "산업 현장에서 요구되는 <span class='font-bold text-slate-300'>실무 준비 수준</span>으로, 문서와 표준 프로세스를 기반으로 운영 환경 기능 구현 및 유지보수가 가능합니다.",
        chipClassName: "bg-slate-500/20 text-slate-300 border border-slate-400/40",
        accentClassName: "text-slate-300",
        barClassName: "bg-slate-400",
        score: 55,
    },
};

const techStack: SkillCategory[] = [
    {
        category: "백엔드",
        icon: Code2,
        skills: [
            {
                name: "TypeScript",
                grade: "A",
                detail: "MSA 백엔드 서비스 다수에서 도메인 모델 설계와 API 표준화를 주도",
                categoryDescription: "서버사이드 개발 및 API 설계",
            },
            {
                name: "Node.js",
                grade: "A",
                detail: "결제·출입·운영정책 API의 핵심 비즈니스 로직을 서비스 단위로 설계/운영",
                categoryDescription: "서버사이드 개발 및 API 설계",
            },
            {
                name: "Java",
                grade: "B",
                detail: "실시간 WebSocket 서버 구축으로 다중 시청자 브로드캐스트와 제어권 동시성 처리 구현",
                categoryDescription: "서버사이드 개발 및 API 설계",
            },
            {
                name: "Spring Boot",
                grade: "C",
                detail: "문서 기반으로 REST API 및 계층형 구조를 구성해 운영 가능한 기능 단위 서비스 구현",
                categoryDescription: "서버사이드 개발 및 API 설계",
            },
            {
                name: "REST API",
                grade: "A",
                detail: "권한/정책/정산 도메인 API를 표준화해 다수 서비스에 재사용 가능한 인터페이스 제공",
                categoryDescription: "서버사이드 개발 및 API 설계",
            },
        ],
    },
    {
        category: "데이터베이스",
        icon: Database,
        skills: [
            {
                name: "DynamoDB",
                grade: "A",
                detail: "접근 패턴 중심 PK/GSI 설계로 조회 성능 저하 이슈를 해결하고 확장성 확보",
                categoryDescription: "데이터 모델링 및 성능 최적화",
            },
            {
                name: "MySQL",
                grade: "B",
                detail: "출입·주차 이력의 정합성 관리와 정기 백업 자동화를 통해 운영 안정성 강화",
                categoryDescription: "데이터 모델링 및 성능 최적화",
            },
            {
                name: "Elasticsearch",
                grade: "B",
                detail: "결제/BI 통계 집계용 인덱스 및 aggregation 쿼리 최적화로 탐색 성능 개선",
                categoryDescription: "데이터 모델링 및 성능 최적화",
            },
            {
                name: "PostgreSQL",
                grade: "C",
                detail: "프로젝트 요구사항에 맞춰 스키마를 운영하며 기능 개발과 유지보수 경험 축적",
                categoryDescription: "데이터 모델링 및 성능 최적화",
            },
        ],
    },
    {
        category: "클라우드 & 인프라",
        icon: Cloud,
        skills: [
            {
                name: "AWS Lambda",
                grade: "A",
                detail: "핵심 비즈니스 서비스의 서버리스 아키텍처 설계 및 cold start/비용 최적화 수행",
                categoryDescription: "AWS 및 서버리스 아키텍처 운영",
            },
            {
                name: "EC2",
                grade: "B",
                detail: "Docker Compose 기반 Java/Python/Nginx 멀티서비스 운영 환경 구축 및 배포 자동화",
                categoryDescription: "AWS 및 서버리스 아키텍처 운영",
            },
            {
                name: "S3",
                grade: "B",
                detail: "정적 자산 및 운영 데이터 보관 정책을 수립해 서비스 안정성 향상",
                categoryDescription: "AWS 및 서버리스 아키텍처 운영",
            },
            {
                name: "SNS/SQS",
                grade: "B",
                detail: "비동기 이벤트 파이프라인을 구성해 정산/알림 처리와 메인 플로우를 분리",
                categoryDescription: "AWS 및 서버리스 아키텍처 운영",
            },
        ],
    },
    {
        category: "아키텍처",
        icon: Layers,
        skills: [
            {
                name: "Microservices",
                grade: "A",
                detail: "도메인 분리·독립 배포·운영정책 모듈화를 통해 서비스 확장 가능한 구조 수립",
                categoryDescription: "설계 패턴 및 시스템 디자인",
            },
            {
                name: "Manager/Proxy Pattern",
                grade: "A",
                detail: "권한 제어와 비즈니스 로직을 레이어별로 분리해 유지보수성과 테스트 용이성 강화",
                categoryDescription: "설계 패턴 및 시스템 디자인",
            },
        ],
    },
    {
        category: "DevOps & 도구",
        icon: Settings,
        skills: [
            {
                name: "GitHub Actions",
                grade: "B",
                detail: "CI 파이프라인 자동화로 빌드/검증 프로세스를 표준화하고 배포 신뢰도 향상",
                categoryDescription: "CI/CD 및 자동화",
            },
            {
                name: "Travis CI",
                grade: "C",
                detail: "기존 레거시 파이프라인 유지보수와 설정 개선으로 릴리즈 안정성 유지",
                categoryDescription: "CI/CD 및 자동화",
            },
            {
                name: "Docker",
                grade: "B",
                detail: "서비스별 컨테이너화와 로컬/운영 환경 일관성 확보로 배포 리스크 감소",
                categoryDescription: "CI/CD 및 자동화",
            },
            {
                name: "Git",
                grade: "B",
                detail: "브랜치 전략과 코드리뷰 기반 협업으로 변경 이력 관리 및 품질 확보",
                categoryDescription: "CI/CD 및 자동화",
            },
        ],
    },
    {
        category: "프론트엔드",
        icon: GitBranch,
        skills: [
            {
                name: "React.js",
                grade: "B",
                detail: "컴포넌트 기반 UI 구조화와 상태 흐름 관리를 통해 대시보드 화면을 안정적으로 구현",
                categoryDescription: "웹 UI 구현 및 사용자 경험 개선",
            },
            {
                name: "JavaScript",
                grade: "B",
                detail: "실시간 데이터 표시와 인터랙션 로직을 구현해 사용자 반응성을 개선",
                categoryDescription: "웹 UI 구현 및 사용자 경험 개선",
            },
            {
                name: "Tailwind CSS",
                grade: "C",
                detail: "디자인 토큰 기반 스타일링으로 반응형 UI를 구현하고 유지보수성 확보",
                categoryDescription: "웹 UI 구현 및 사용자 경험 개선",
            },
        ],
    },
];

export const TechStack = () => {
    return (
        <section id="skills" className="section-container bg-gray-900">
            <h2 className="section-title">
                기술 <span className="text-primary-400">스택</span>
            </h2>

            <div className="max-w-5xl mx-auto mb-8 card bg-gray-900/60 backdrop-blur-sm border border-gray-700/70">
                <h3 className="text-base font-bold text-gray-100 uppercase tracking-wider mb-4">
                    등급 가이드 · 실무 경험 기준
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {(Object.entries(gradeMeta) as Array<[Skill["grade"], GradeMeta]>).map(
                        ([grade, meta]) => (
                            <div
                                key={grade}
                                className="rounded-lg border border-gray-700/70 bg-gray-900/50 p-3"
                            >
                                <div
                                    className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-base font-bold shadow-lg ${meta.chipClassName} border`}
                                >
                                    <span>등급 {grade} · </span>
                                    <span dangerouslySetInnerHTML={{ __html: meta.title }} />
                                </div>
                                <p
                                    className="mt-2 text-sm text-gray-300 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: meta.definition }}
                                />
                            </div>
                        ),
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {techStack.map((category) => {
                    const Icon = category.icon;
                    const categoryDescription = category.skills[0]?.categoryDescription ?? "";

                    return (
                        <div key={category.category} className="card group">
                            {/* Category Header */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-primary-900/30 rounded-lg group-hover:bg-primary-900/50 transition-colors">
                                    <Icon className="w-6 h-6 text-primary-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white">
                                        {category.category}
                                    </h3>
                                    <p className="text-sm text-gray-400">{categoryDescription}</p>
                                </div>
                            </div>

                            {/* Skills */}
                            <div className="space-y-3">
                                {category.skills.map((skill) => (
                                    <div key={skill.name} className="relative group/skill">
                                        <div className="w-full rounded-lg bg-gray-800/70 border border-gray-700/80 hover:border-primary-500/50 transition-all duration-300 cursor-default p-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <span className="text-base text-primary-300 font-semibold">
                                                    {skill.name}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-md text-xs font-bold ${gradeMeta[skill.grade].chipClassName}`}
                                                >
                                                    {skill.grade}
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 w-full bg-gray-900 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${gradeMeta[skill.grade].barClassName}`}
                                                    style={{
                                                        width: `${gradeMeta[skill.grade].score}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div className="pointer-events-none absolute left-1/2 top-full mt-2 w-72 max-w-[90vw] -translate-x-1/2 opacity-0 translate-y-1 group-hover/skill:opacity-100 group-hover/skill:translate-y-0 transition-all duration-300 z-30">
                                            <div className="rounded-xl border border-white/20 bg-gray-900/70 backdrop-blur-md shadow-2xl shadow-black/40 p-4">
                                                <p className="text-sm uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                                                    등급
                                                </p>
                                                <p
                                                    className={`text-base font-bold mb-2 ${gradeMeta[skill.grade].accentClassName}`}
                                                >
                                                    {skill.grade} · {gradeMeta[skill.grade].title}
                                                </p>
                                                <p className="text-sm text-gray-200 leading-relaxed mb-3">
                                                    {gradeMeta[skill.grade].definition}
                                                </p>

                                                <p className="text-sm uppercase tracking-wider text-gray-400 mb-1 font-semibold">
                                                    핵심 실무 기여
                                                </p>
                                                <p className="text-sm text-gray-100 leading-relaxed">
                                                    {skill.detail}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <p className="mt-10 text-center text-sm text-gray-400">
                각 기술 항목에 마우스를 올리면 등급 기준과 실무 기여 내용을 확인할 수 있습니다.
            </p>
        </section>
    );
};
