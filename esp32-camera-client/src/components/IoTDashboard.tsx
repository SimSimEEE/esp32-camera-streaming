/**
 * `IoTDashboard.tsx`
 * - ESP32-CAM IoT 시스템 프로젝트 상세 정보
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-23 refactored as project detail view
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import {
    MessageSquare,
    Github,
    Lightbulb,
    BarChart2,
    Layers,
    AlertTriangle,
    CheckCircle2,
} from "lucide-react";
import { CameraViewer } from "./CameraViewer";

const esp32Project = {
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
        "<span class='text-primary-400 font-semibold'>WebSocket</span> 기반 <span class='text-cyan-400 font-semibold'>실시간</span> 양방향 통신 및 다중 시청자 브로드캐스트",
        "Java <span class='text-amber-400 font-semibold'>Semaphore/AtomicReference</span>로 다수 클라이언트 동시 제어권 충돌 방지",
        "Python <span class='text-green-400 font-semibold'>AI Analyzer</span>가 프레임 분석 후 <span class='text-purple-400 font-semibold'>BoundingBox</span>를 역방향으로 Canvas에 오버레이",
        "Git <span class='text-blue-400 font-semibold'>pre-commit Hook</span> 기반 자동 버전 bump 및 <span class='text-pink-400 font-semibold'>DuckDNS + SSL</span> 프로덕션 배포",
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
};

export const IoTDashboard = () => {
    const project = esp32Project;
    const Icon = project.icon;

    return (
        <section id="iot-project" className="section-container bg-gray-950">
            {/* Connection from Career Timeline */}
            <div className="flex items-center justify-center mb-8 -mt-8">
                <div className="h-16 w-0.5 bg-gradient-to-b from-transparent via-cyan-500 to-cyan-500/50"></div>
            </div>
            <div className="rounded-2xl border border-primary-800/40 bg-gray-900/60 overflow-hidden shadow-2xl shadow-primary-950/40">
                {/* Panel Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/80">
                    <div className="flex items-center gap-3">
                        <div
                            className={`p-2 bg-gradient-to-br ${project.color} rounded-lg shrink-0`}
                        >
                            <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-100">{project.title}</h3>
                            <p className="text-xs text-gray-500">
                                {project.company} · {project.period}
                            </p>
                        </div>
                    </div>
                    <a
                        href={project.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <Github className="w-4 h-4 text-gray-400 hover:text-white transition-colors" />
                    </a>
                </div>

                {/* Panel Body */}
                <div className="p-0">
                    <CameraViewer />
                </div>

                {/* Project Details (Hidden, for reference) */}
                <div className="hidden p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Metrics */}
                    {project.metrics && project.metrics.length > 0 && (
                        <div className="md:col-span-2">
                            <h4 className="flex items-center gap-1.5 text-base font-bold text-primary-200 mb-3 uppercase tracking-wider">
                                <BarChart2 className="w-5 h-5 text-primary-300" />
                                핵심 지표
                            </h4>
                            <div className="grid grid-cols-3 gap-3">
                                {project.metrics.map((m, i) => (
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
                    {project.architecture && project.architecture.length > 0 && (
                        <div>
                            <h4 className="flex items-center gap-1.5 text-sm font-bold mb-2 uppercase tracking-wider">
                                <Layers className="w-4 h-4 text-cyan-400" />
                                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                    Architecture
                                </span>
                            </h4>
                            <ul className="space-y-2">
                                {project.architecture.map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-xs text-gray-500"
                                    >
                                        <span className="text-cyan-600 mt-0.5 shrink-0">◆</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Challenges */}
                    {project.challenges && project.challenges.length > 0 && (
                        <div>
                            <h4 className="flex items-center gap-1.5 text-sm font-bold mb-2 uppercase tracking-wider">
                                <AlertTriangle className="w-4 h-4 text-amber-400" />
                                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                                    Technical Challenges
                                </span>
                            </h4>
                            <ul className="space-y-2">
                                {project.challenges.map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-xs text-gray-500"
                                    >
                                        <span className="text-amber-600 mt-0.5 shrink-0">!</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Outcome */}
                    {project.outcome && project.outcome.length > 0 && (
                        <div>
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                Outcome
                            </h4>
                            <ul className="space-y-2">
                                {project.outcome.map((item, i) => (
                                    <li
                                        key={i}
                                        className="flex items-start gap-2 text-xs text-gray-500"
                                    >
                                        <span className="text-green-600 mt-0.5 shrink-0">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Problem Solving */}
                    {project.problemSolving && project.problemSolving.length > 0 && (
                        <div className="md:col-span-2">
                            <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                                <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                                Problem Solving
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {project.problemSolving.map((ps, i) => (
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
            </div>
        </section>
    );
};
