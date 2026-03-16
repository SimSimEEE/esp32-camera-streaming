/**
 * `GimbalViewer3D.tsx`
 * - 3D visualization of ESP32 gimbal using Three.js
 * - Real-time pitch/roll angle updates from telemetry
 * - Interactive camera controls with OrbitControls
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-21 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import * as THREE from "three";
import type { GimbalTelemetry } from "../hooks/useGimbalWebSocket";

/**
 * Gimbal 3D model component
 */
const Gimbal3DModel = ({ telemetry }: { telemetry: GimbalTelemetry | null }) => {
    const pitchAxisRef = useRef<THREE.Group>(null);
    const rollAxisRef = useRef<THREE.Group>(null);
    const cameraBoxRef = useRef<THREE.Mesh>(null);

    /**
     * Update rotations from telemetry
     */
    useFrame(() => {
        if (!telemetry) return;

        // Apply rotations (convert degrees to radians)
        if (pitchAxisRef.current) {
            pitchAxisRef.current.rotation.x = THREE.MathUtils.degToRad(telemetry.pitchAngle);
        }

        if (rollAxisRef.current) {
            rollAxisRef.current.rotation.z = THREE.MathUtils.degToRad(telemetry.rollAngle);
        }

        // Pulse effect on camera box
        if (cameraBoxRef.current) {
            const scale = 1 + Math.sin(Date.now() * 0.003) * 0.05;
            cameraBoxRef.current.scale.setScalar(scale);
        }
    });

    return (
        <group position={[0, 0, 0]}>
            {/* Base platform */}
            <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1.5, 1.5, 0.2, 32]} />
                <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Base axis label */}
            <Text
                position={[0, -0.7, 0]}
                fontSize={0.15}
                color="#ecf0f1"
                anchorX="center"
                anchorY="middle"
            >
                BASE
            </Text>

            {/* Roll axis (outer) - rotates around Z */}
            <group ref={rollAxisRef}>
                {/* Roll ring */}
                <mesh>
                    <torusGeometry args={[1.2, 0.08, 16, 32]} />
                    <meshStandardMaterial color="#3498db" metalness={0.6} roughness={0.3} />
                </mesh>

                {/* Roll axis markers */}
                <mesh position={[1.2, 0, 0]}>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial
                        color="#e74c3c"
                        emissive="#e74c3c"
                        emissiveIntensity={0.5}
                    />
                </mesh>
                <mesh position={[-1.2, 0, 0]}>
                    <sphereGeometry args={[0.12, 16, 16]} />
                    <meshStandardMaterial
                        color="#e74c3c"
                        emissive="#e74c3c"
                        emissiveIntensity={0.5}
                    />
                </mesh>

                {/* Roll axis label */}
                <Text
                    position={[1.5, 0, 0]}
                    fontSize={0.15}
                    color="#3498db"
                    anchorX="left"
                    anchorY="middle"
                >
                    ROLL
                </Text>

                {/* Pitch axis (inner) - rotates around X */}
                <group ref={pitchAxisRef}>
                    {/* Pitch ring */}
                    <mesh rotation={[0, 0, Math.PI / 2]}>
                        <torusGeometry args={[0.9, 0.08, 16, 32]} />
                        <meshStandardMaterial color="#2ecc71" metalness={0.6} roughness={0.3} />
                    </mesh>

                    {/* Pitch axis markers */}
                    <mesh position={[0, 0.9, 0]}>
                        <sphereGeometry args={[0.12, 16, 16]} />
                        <meshStandardMaterial
                            color="#f39c12"
                            emissive="#f39c12"
                            emissiveIntensity={0.5}
                        />
                    </mesh>
                    <mesh position={[0, -0.9, 0]}>
                        <sphereGeometry args={[0.12, 16, 16]} />
                        <meshStandardMaterial
                            color="#f39c12"
                            emissive="#f39c12"
                            emissiveIntensity={0.5}
                        />
                    </mesh>

                    {/* Pitch axis label */}
                    <Text
                        position={[0, 1.2, 0]}
                        fontSize={0.15}
                        color="#2ecc71"
                        anchorX="center"
                        anchorY="bottom"
                    >
                        PITCH
                    </Text>

                    {/* Camera box (center) */}
                    <mesh ref={cameraBoxRef}>
                        <boxGeometry args={[0.5, 0.3, 0.4]} />
                        <meshStandardMaterial
                            color="#9b59b6"
                            metalness={0.5}
                            roughness={0.4}
                            emissive="#9b59b6"
                            emissiveIntensity={0.2}
                        />
                    </mesh>

                    {/* Camera lens */}
                    <mesh rotation={[0, Math.PI / 2, 0]} position={[0.25, 0, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, 0.05, 16]} />
                        <meshStandardMaterial color="#34495e" metalness={0.9} roughness={0.1} />
                    </mesh>

                    {/* Camera label */}
                    <Text
                        position={[0, -0.3, 0]}
                        fontSize={0.12}
                        color="#ecf0f1"
                        anchorX="center"
                        anchorY="top"
                    >
                        ESP32-CAM
                    </Text>
                </group>
            </group>

            {/* Coordinate axes helper (small) */}
            <axesHelper args={[0.5]} position={[0, -0.8, 0]} />
        </group>
    );
};

/**
 * Angle display overlay
 */
const AngleDisplay = ({ telemetry }: { telemetry: GimbalTelemetry | null }) => {
    if (!telemetry) return null;

    return (
        <>
            {/* Pitch angle text */}
            <Text
                position={[-2.5, 2, 0]}
                fontSize={0.25}
                color="#2ecc71"
                anchorX="left"
                anchorY="middle"
            >
                {`Pitch: ${telemetry.pitchAngle.toFixed(2)}°`}
            </Text>

            {/* Roll angle text */}
            <Text
                position={[-2.5, 1.5, 0]}
                fontSize={0.25}
                color="#3498db"
                anchorX="left"
                anchorY="middle"
            >
                {`Roll: ${telemetry.rollAngle.toFixed(2)}°`}
            </Text>

            {/* PID output indicators */}
            <Text
                position={[-2.5, 0.8, 0]}
                fontSize={0.18}
                color="#f39c12"
                anchorX="left"
                anchorY="middle"
            >
                {`Pitch PID: ${telemetry.pitchPidOutput.toFixed(2)}`}
            </Text>

            <Text
                position={[-2.5, 0.5, 0]}
                fontSize={0.18}
                color="#f39c12"
                anchorX="left"
                anchorY="middle"
            >
                {`Roll PID: ${telemetry.rollPidOutput.toFixed(2)}`}
            </Text>
        </>
    );
};

/**
 * GimbalViewer3D Component
 */
export const GimbalViewer3D = ({ telemetry }: { telemetry: GimbalTelemetry | null }) => {
    return (
        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl overflow-hidden shadow-2xl">
            <Canvas
                camera={{ position: [4, 3, 4], fov: 50 }}
                gl={{ antialias: true, alpha: false }}
                shadows
            >
                {/* Lighting */}
                <ambientLight intensity={0.4} />
                <directionalLight
                    position={[5, 5, 5]}
                    intensity={0.8}
                    castShadow
                    shadow-mapSize={[1024, 1024]}
                />
                <pointLight position={[-5, 3, -5]} intensity={0.3} color="#3498db" />
                <pointLight position={[5, 3, 5]} intensity={0.3} color="#e74c3c" />

                {/* Grid helper */}
                <Grid
                    args={[10, 10]}
                    cellSize={0.5}
                    cellThickness={0.5}
                    cellColor="#34495e"
                    sectionSize={2}
                    sectionThickness={1}
                    sectionColor="#7f8c8d"
                    fadeDistance={25}
                    fadeStrength={1}
                    followCamera={false}
                    infiniteGrid={false}
                />

                {/* Gimbal model */}
                <Gimbal3DModel telemetry={telemetry} />

                {/* Angle display */}
                <AngleDisplay telemetry={telemetry} />

                {/* Camera controls */}
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={2}
                    maxDistance={15}
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2}
                />
            </Canvas>

            {/* Status overlay */}
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="text-white text-sm font-mono">
                    {telemetry ? (
                        <>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <span>Connected</span>
                            </div>
                            <div className="mt-1 text-xs text-gray-300">
                                FPS: 60 | Heap: {(telemetry.freeHeap / 1024).toFixed(1)}KB
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                            <span>No telemetry</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
