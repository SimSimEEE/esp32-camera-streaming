/**
 * `MotionAlerts.tsx`
 * - Motion detection alerts display component
 * - Shows real-time motion events from AI analyzer
 *
 * @author      Sim Si-Geun <sim@granule.io>
 * @date        2026-02-19 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

import React, { useState, useEffect } from "react";

// Types
type MotionLevel = "none" | "low" | "medium" | "high" | "critical";
type ChangeType = "person" | "object" | "light" | "camera" | "unknown";

interface MotionEvent {
    frameNumber: number;
    motionLevel: MotionLevel;
    changePercentage: number;
    changeType: ChangeType;
    description: string;
    confidence: number;
    timestamp: string;
}

interface DebugInfo {
    frameNumber: number;
    motionLevel: MotionLevel;
    changePercentage: number;
    frameSize: string;
    contourCount: number;
    contourBoxes: { x: number; y: number; w: number; h: number }[];
    timestamp: string;
}

interface MotionAlertsProps {
    websocket: WebSocket | null;
    maxEvents?: number;
}

const NS = "[MotionAlerts]";

/**
 * Motion detection alerts component
 */
const MotionAlerts: React.FC<MotionAlertsProps> = ({ websocket, maxEvents = 10 }) => {
    const [events, setEvents] = useState<MotionEvent[]>([]);
    const [isEnabled, setIsEnabled] = useState(true);
    const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
    const [showDebug, setShowDebug] = useState(true);

    useEffect(() => {
        if (!websocket || !isEnabled) return;

        const handleMessage = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === "motion_event") {
                    console.log(NS, "Motion event received:", data.data);

                    const motionEvent: MotionEvent = {
                        frameNumber: data.data.frame_number,
                        motionLevel: data.data.motion_level,
                        changePercentage: data.data.change_percentage,
                        changeType: data.data.change_type,
                        description: data.data.description,
                        confidence: data.data.confidence,
                        timestamp: data.data.timestamp,
                    };

                    setEvents((prev) => [motionEvent, ...prev].slice(0, maxEvents));
                } else if (data.type === "motion_debug") {
                    // Update debug info
                    setDebugInfo({
                        frameNumber: data.data.frame_number,
                        motionLevel: data.data.motion_level,
                        changePercentage: data.data.change_percentage,
                        frameSize: data.data.frame_size,
                        contourCount: data.data.contour_count ?? 0,
                        contourBoxes: data.data.contour_boxes ?? [],
                        timestamp: data.data.timestamp,
                    });
                }
            } catch (error) {
                // Not JSON, ignore
            }
        };

        websocket.addEventListener("message", handleMessage);

        return () => {
            websocket.removeEventListener("message", handleMessage);
        };
    }, [websocket, isEnabled, maxEvents]);

    const getMotionLevelColor = (level: MotionLevel): string => {
        switch (level) {
            case "critical":
                return "bg-red-500";
            case "high":
                return "bg-orange-500";
            case "medium":
                return "bg-yellow-500";
            case "low":
                return "bg-blue-500";
            default:
                return "bg-gray-500";
        }
    };

    const getChangeTypeIcon = (type: ChangeType): string => {
        switch (type) {
            case "person":
                return "👤";
            case "object":
                return "📦";
            case "light":
                return "💡";
            case "camera":
                return "📹";
            default:
                return "❓";
        }
    };

    const clearEvents = () => {
        setEvents([]);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    🎯 모션 감지 알림
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            showDebug
                                ? "bg-blue-500 hover:bg-blue-600 text-white"
                                : "bg-gray-400 hover:bg-gray-500 text-white"
                        }`}
                    >
                        {showDebug ? "🐛 디버그" : "디버그"}
                    </button>
                    <button
                        onClick={() => setIsEnabled(!isEnabled)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            isEnabled
                                ? "bg-green-500 hover:bg-green-600 text-white"
                                : "bg-gray-500 hover:bg-gray-600 text-white"
                        }`}
                    >
                        {isEnabled ? "활성화" : "비활성화"}
                    </button>
                    <button
                        onClick={clearEvents}
                        className="px-4 py-2 rounded-lg font-semibold bg-red-500 hover:bg-red-600 text-white transition-colors"
                    >
                        지우기
                    </button>
                </div>
            </div>

            {/* Debug Console */}
            {showDebug && debugInfo && (
                <div className="mb-4 p-4 bg-gray-900 text-green-400 font-mono text-sm rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start">
                        <div className="space-y-1">
                            <div>📊 OpenCV Motion Detector Status</div>
                            <div className="text-gray-500">━━━━━━━━━━━━━━━━━━━━━━━━━━━━</div>
                            <div>Frame: #{debugInfo.frameNumber}</div>
                            <div>Size: {debugInfo.frameSize}</div>
                            <div>
                                Motion:{" "}
                                <span
                                    className={
                                        debugInfo.motionLevel === "none"
                                            ? "text-gray-500"
                                            : debugInfo.motionLevel === "low"
                                              ? "text-blue-400"
                                              : debugInfo.motionLevel === "medium"
                                                ? "text-yellow-400"
                                                : debugInfo.motionLevel === "high"
                                                  ? "text-orange-400"
                                                  : "text-red-400"
                                    }
                                >
                                    {debugInfo.motionLevel.toUpperCase()}
                                </span>
                            </div>
                            <div>Change: {debugInfo.changePercentage.toFixed(2)}%</div>
                            <div>Contours: {debugInfo.contourCount ?? 0}개</div>
                            {debugInfo.contourBoxes && debugInfo.contourBoxes.length > 0 && (
                                <div className="mt-2">
                                    <div className="text-gray-400">📐 감지 좌표 (상위 3개):</div>
                                    {debugInfo.contourBoxes.slice(0, 3).map((b, i) => (
                                        <div key={i} className="text-xs text-cyan-300 pl-2">
                                            [{i+1}] x={b.x} y={b.y} {b.w}×{b.h}px
                                        </div>
                                    ))}
                                </div>
                            )}
                            {(!debugInfo.contourBoxes || debugInfo.contourBoxes.length === 0) &&
                             debugInfo.motionLevel !== 'none' && (
                                <div className="text-xs text-yellow-500 mt-1">⚠️ 좌표 없음 (면적 미달)</div>
                            )}
                            <div className="text-gray-500 text-xs mt-2">
                                Last update:{" "}
                                {new Date(debugInfo.timestamp).toLocaleTimeString("ko-KR")}
                            </div>
                        </div>
                        <div className="text-xs text-gray-600">
                            {debugInfo.motionLevel === "none" && "😴 정적"}
                            {debugInfo.motionLevel === "low" && "👀 약한 움직임"}
                            {debugInfo.motionLevel === "medium" && "🚶 중간 움직임"}
                            {debugInfo.motionLevel === "high" && "🏃 빠른 움직임"}
                            {debugInfo.motionLevel === "critical" && "⚡ 급격한 변화"}
                        </div>
                    </div>
                </div>
            )}

            {!debugInfo && showDebug && (
                <div className="mb-4 p-4 bg-gray-900 text-yellow-400 font-mono text-sm rounded-lg border border-gray-700">
                    ⚠️ Motion Detector에서 데이터를 수신 대기 중...
                </div>
            )}

            {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {isEnabled ? "모션 감지 대기 중..." : "모션 감지 비활성화됨"}
                </div>
            ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                    {events.map((event, index) => (
                        <div
                            key={`${event.timestamp}-${index}`}
                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                    <span className="text-3xl">
                                        {getChangeTypeIcon(event.changeType)}
                                    </span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span
                                                className={`px-3 py-1 rounded-full text-white text-xs font-bold ${getMotionLevelColor(
                                                    event.motionLevel,
                                                )}`}
                                            >
                                                {event.motionLevel.toUpperCase()}
                                            </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                {event.changePercentage.toFixed(2)}% 변화
                                            </span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                                신뢰도: {(event.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                        <p className="text-gray-800 dark:text-gray-200 font-medium">
                                            {event.description}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {new Date(event.timestamp).toLocaleTimeString("ko-KR")}{" "}
                                            • Frame #{event.frameNumber}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {events.length > 0 && (
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-right">
                    총 {events.length}개의 이벤트
                </div>
            )}
        </div>
    );
};

export default MotionAlerts;
