/**
 * `GimbalDashboard.tsx`
 * - Main gimbal control dashboard component
 * - Integrates WebSocket hook, 3D viewer, charts, and controls
 * - Real-time telemetry display and PID tuning
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-21 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

import { useState, useEffect, useRef } from "react";
import { useGimbalWebSocket } from "../hooks/useGimbalWebSocket";
import { GimbalViewer3D } from "./GimbalViewer3D";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Activity, Wifi, WifiOff, RotateCw, Settings, TrendingUp } from "lucide-react";

/**
 * Get WebSocket URL from environment or construct from window.location
 */
const getWebSocketUrl = (): string => {
    // Check environment variable first
    const envUrl = import.meta.env.VITE_GIMBAL_WS_URL;
    if (envUrl) return envUrl;

    // Construct from window.location
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.hostname;
    const port = window.location.port || (protocol === "wss:" ? "443" : "80");

    return `${protocol}//${host}:${port}/gimbal/dashboard`;
};

/**
 * Telemetry history data point
 */
interface TelemetryDataPoint {
    timestamp: number;
    pitch: number;
    roll: number;
    pitchPid: number;
    rollPid: number;
}

/**
 * Control panel props
 */
interface ControlPanelProps {
    onControl: (pitch: number, roll: number) => void;
    onPIDUpdate: (axis: 0 | 1, kp: number, ki: number, kd: number) => void;
    isConnected: boolean;
}

/**
 * Control panel component
 */
const ControlPanel = ({ onControl, onPIDUpdate, isConnected }: ControlPanelProps) => {
    const [targetPitch, setTargetPitch] = useState<number>(0);
    const [targetRoll, setTargetRoll] = useState<number>(0);

    // PID gains (Pitch)
    const [pitchKp, setPitchKp] = useState<number>(1.0);
    const [pitchKi, setPitchKi] = useState<number>(0.0);
    const [pitchKd, setPitchKd] = useState<number>(0.0);

    // PID gains (Roll)
    const [rollKp, setRollKp] = useState<number>(1.0);
    const [rollKi, setRollKi] = useState<number>(0.0);
    const [rollKd, setRollKd] = useState<number>(0.0);

    const handleControlSubmit = (): void => {
        onControl(targetPitch, targetRoll);
    };

    const handlePitchPIDSubmit = (): void => {
        onPIDUpdate(0, pitchKp, pitchKi, pitchKd);
    };

    const handleRollPIDSubmit = (): void => {
        onPIDUpdate(1, rollKp, rollKi, rollKd);
    };

    return (
        <div className="space-y-4">
            {/* Position Control */}
            <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-400" />
                    Position Control
                </h3>

                <div className="space-y-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Target Pitch: {targetPitch.toFixed(1)}°
                        </label>
                        <input
                            type="range"
                            min="-90"
                            max="90"
                            step="1"
                            value={targetPitch}
                            onChange={(e) => setTargetPitch(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            disabled={!isConnected}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                            Target Roll: {targetRoll.toFixed(1)}°
                        </label>
                        <input
                            type="range"
                            min="-90"
                            max="90"
                            step="1"
                            value={targetRoll}
                            onChange={(e) => setTargetRoll(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            disabled={!isConnected}
                        />
                    </div>

                    <button
                        onClick={handleControlSubmit}
                        disabled={!isConnected}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        <Activity className="w-4 h-4" />
                        Send Command
                    </button>
                </div>
            </div>

            {/* PID Tuning - Pitch */}
            <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-green-400" />
                    Pitch PID Tuning
                </h3>

                <div className="space-y-2">
                    <input
                        type="number"
                        step="0.1"
                        value={pitchKp}
                        onChange={(e) => setPitchKp(parseFloat(e.target.value))}
                        placeholder="Kp"
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                        disabled={!isConnected}
                    />
                    <input
                        type="number"
                        step="0.1"
                        value={pitchKi}
                        onChange={(e) => setPitchKi(parseFloat(e.target.value))}
                        placeholder="Ki"
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                        disabled={!isConnected}
                    />
                    <input
                        type="number"
                        step="0.1"
                        value={pitchKd}
                        onChange={(e) => setPitchKd(parseFloat(e.target.value))}
                        placeholder="Kd"
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-green-500 focus:outline-none"
                        disabled={!isConnected}
                    />

                    <button
                        onClick={handlePitchPIDSubmit}
                        disabled={!isConnected}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Update Pitch PID
                    </button>
                </div>
            </div>

            {/* PID Tuning - Roll */}
            <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-blue-400" />
                    Roll PID Tuning
                </h3>

                <div className="space-y-2">
                    <input
                        type="number"
                        step="0.1"
                        value={rollKp}
                        onChange={(e) => setRollKp(parseFloat(e.target.value))}
                        placeholder="Kp"
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        disabled={!isConnected}
                    />
                    <input
                        type="number"
                        step="0.1"
                        value={rollKi}
                        onChange={(e) => setRollKi(parseFloat(e.target.value))}
                        placeholder="Ki"
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        disabled={!isConnected}
                    />
                    <input
                        type="number"
                        step="0.1"
                        value={rollKd}
                        onChange={(e) => setRollKd(parseFloat(e.target.value))}
                        placeholder="Kd"
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        disabled={!isConnected}
                    />

                    <button
                        onClick={handleRollPIDSubmit}
                        disabled={!isConnected}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                        Update Roll PID
                    </button>
                </div>
            </div>
        </div>
    );
};

/**
 * Main GimbalDashboard component
 */
export const GimbalDashboard = () => {
    const wsUrl = getWebSocketUrl();
    const { telemetry, connectionState, error, sendControl, sendPIDUpdate, reconnect } =
        useGimbalWebSocket(wsUrl);

    const [telemetryHistory, setTelemetryHistory] = useState<TelemetryDataPoint[]>([]);
    const maxHistoryPoints = 100;

    // Prevent cascading renders with useRef
    const lastTelemetryTimestampRef = useRef<number>(0);

    /**
     * Update telemetry history (throttled to prevent cascading renders)
     */
    useEffect(() => {
        if (!telemetry) return;

        // Throttle updates to every 100ms
        const now = Date.now();
        if (now - lastTelemetryTimestampRef.current < 100) {
            return;
        }

        lastTelemetryTimestampRef.current = now;

        setTelemetryHistory((prev) => {
            const newPoint: TelemetryDataPoint = {
                timestamp: now,
                pitch: telemetry.pitchAngle,
                roll: telemetry.rollAngle,
                pitchPid: telemetry.pitchPidOutput,
                rollPid: telemetry.rollPidOutput,
            };

            const updated = [...prev, newPoint];

            // Keep only last N points
            if (updated.length > maxHistoryPoints) {
                return updated.slice(updated.length - maxHistoryPoints);
            }

            return updated;
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [telemetry?.timestamp]);

    /**
     * Handle control command
     */
    const handleControl = (pitch: number, roll: number): void => {
        sendControl(pitch, roll);
    };

    /**
     * Handle PID update
     */
    const handlePIDUpdate = (axis: 0 | 1, kp: number, ki: number, kd: number): void => {
        const minLimit = -90.0;
        const maxLimit = 90.0;
        sendPIDUpdate(axis, kp, ki, kd, minLimit, maxLimit);
    };

    const isConnected = connectionState === "connected";

    return (
        <div className="min-h-screen bg-gray-900 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Activity className="w-8 h-8 text-blue-500" />
                        ESP32 Gimbal Dashboard
                    </h1>

                    <div className="flex items-center gap-4">
                        {/* Connection status */}
                        <div
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                                isConnected
                                    ? "bg-green-900/30 text-green-400"
                                    : "bg-red-900/30 text-red-400"
                            }`}
                        >
                            {isConnected ? (
                                <>
                                    <Wifi className="w-5 h-5 animate-pulse" />
                                    <span className="font-medium">Connected</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-5 h-5" />
                                    <span className="font-medium">{connectionState}</span>
                                </>
                            )}
                        </div>

                        {/* Reconnect button */}
                        <button
                            onClick={reconnect}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RotateCw className="w-4 h-4" />
                            Reconnect
                        </button>
                    </div>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mt-4 bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg">
                        <strong>Error:</strong> {error}
                    </div>
                )}
            </div>

            {/* Main content grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 3D Viewer - 2 columns */}
                <div className="lg:col-span-2 h-[600px]">
                    <GimbalViewer3D telemetry={telemetry} />
                </div>

                {/* Control Panel - 1 column */}
                <div className="lg:col-span-1">
                    <ControlPanel
                        onControl={handleControl}
                        onPIDUpdate={handlePIDUpdate}
                        isConnected={isConnected}
                    />
                </div>
            </div>

            {/* Charts */}
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Attitude Chart */}
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        Attitude (Pitch/Roll)
                    </h3>

                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={telemetryHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="timestamp"
                                type="number"
                                domain={["dataMin", "dataMax"]}
                                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                                stroke="#9CA3AF"
                            />
                            <YAxis stroke="#9CA3AF" domain={[-90, 90]} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1F2937",
                                    border: "1px solid #374151",
                                }}
                                labelStyle={{ color: "#D1D5DB" }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="pitch"
                                stroke="#10B981"
                                strokeWidth={2}
                                dot={false}
                                name="Pitch (°)"
                            />
                            <Line
                                type="monotone"
                                dataKey="roll"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={false}
                                name="Roll (°)"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* PID Output Chart */}
                <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-orange-400" />
                        PID Output
                    </h3>

                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={telemetryHistory}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="timestamp"
                                type="number"
                                domain={["dataMin", "dataMax"]}
                                tickFormatter={(ts) => new Date(ts).toLocaleTimeString()}
                                stroke="#9CA3AF"
                            />
                            <YAxis stroke="#9CA3AF" />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1F2937",
                                    border: "1px solid #374151",
                                }}
                                labelStyle={{ color: "#D1D5DB" }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="pitchPid"
                                stroke="#F59E0B"
                                strokeWidth={2}
                                dot={false}
                                name="Pitch PID"
                            />
                            <Line
                                type="monotone"
                                dataKey="rollPid"
                                stroke="#EC4899"
                                strokeWidth={2}
                                dot={false}
                                name="Roll PID"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
