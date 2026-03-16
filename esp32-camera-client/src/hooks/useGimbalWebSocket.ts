/**
 * `useGimbalWebSocket.ts`
 * - React hook for ESP32 gimbal WebSocket connection
 * - Binary protocol parser matching Java GimbalProtocol
 * - Real-time telemetry streaming with CRC16 verification
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-21 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Protocol constants (match Java GimbalProtocol)
const MAGIC_NUMBER = 0xAA55;
const PROTOCOL_VERSION = 0x01;

// Message types
const MSG_TYPE_TELEMETRY = 0x01;
const MSG_TYPE_CONTROL = 0x02;
const MSG_TYPE_PID_UPDATE = 0x03;
const MSG_TYPE_HEARTBEAT = 0x04;

// Message sizes
const HEADER_SIZE = 6;
const TELEMETRY_SIZE = 40;
const CONTROL_SIZE = 8;
const PID_UPDATE_SIZE = 24;
const HEARTBEAT_SIZE = 8;
const CRC_SIZE = 2;

// CRC16 MODBUS polynomial
const CRC16_POLY = 0xA001;

/**
 * Telemetry data structure
 */
export interface GimbalTelemetry {
    timestamp: number;
    pitchAngle: number;
    rollAngle: number;
    yawAngle: number;
    pitchRate: number;
    rollRate: number;
    pitchPidOutput: number;
    rollPidOutput: number;
    freeHeap: number;
    cpuUsage: number;
}

/**
 * Connection state
 */
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Hook return type
 */
export interface UseGimbalWebSocketReturn {
    telemetry: GimbalTelemetry | null;
    connectionState: ConnectionState;
    error: string | null;
    sendControl: (targetPitch: number, targetRoll: number) => void;
    sendPIDUpdate: (axis: 0 | 1, kp: number, ki: number, kd: number, minLimit: number, maxLimit: number) => void;
    reconnect: () => void;
}

/**
 * Calculate CRC16 MODBUS (matches Java implementation)
 */
const calculateCRC16 = (data: Uint8Array, length: number): number => {
    let crc = 0xFFFF;
    
    for (let i = 0; i < length; i++) {
        crc ^= data[i];
        
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x0001) !== 0) {
                crc >>= 1;
                crc ^= CRC16_POLY;
            } else {
                crc >>= 1;
            }
        }
    }
    
    return crc & 0xFFFF;
};

/**
 * Parse telemetry payload from DataView (little-endian)
 */
const parseTelemetry = (view: DataView, offset: number): GimbalTelemetry => {
    return {
        timestamp: view.getUint32(offset, true),
        pitchAngle: view.getFloat32(offset + 4, true),
        rollAngle: view.getFloat32(offset + 8, true),
        yawAngle: view.getFloat32(offset + 12, true),
        pitchRate: view.getFloat32(offset + 16, true),
        rollRate: view.getFloat32(offset + 20, true),
        pitchPidOutput: view.getFloat32(offset + 24, true),
        rollPidOutput: view.getFloat32(offset + 28, true),
        freeHeap: view.getUint32(offset + 32, true),
        cpuUsage: view.getUint32(offset + 36, true),
    };
};

/**
 * Build binary message with header + payload + CRC
 */
const buildMessage = (messageType: number, payload: Uint8Array): Uint8Array => {
    const totalSize = HEADER_SIZE + payload.length + CRC_SIZE;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    // Header
    view.setUint16(0, MAGIC_NUMBER, true);
    view.setUint8(2, PROTOCOL_VERSION);
    view.setUint8(3, messageType);
    view.setUint16(4, payload.length, true);
    
    // Payload
    const uint8 = new Uint8Array(buffer);
    uint8.set(payload, HEADER_SIZE);
    
    // CRC (header + payload)
    const dataForCrc = uint8.slice(0, HEADER_SIZE + payload.length);
    const crc = calculateCRC16(dataForCrc, dataForCrc.length);
    view.setUint16(HEADER_SIZE + payload.length, crc, true);
    
    return uint8;
};

/**
 * React hook for gimbal WebSocket connection
 */
export const useGimbalWebSocket = (url: string): UseGimbalWebSocketReturn => {
    const [telemetry, setTelemetry] = useState<GimbalTelemetry | null>(null);
    const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected');
    const [error, setError] = useState<string | null>(null);
    
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const heartbeatIntervalRef = useRef<number | null>(null);
    const heartbeatSequenceRef = useRef<number>(0);
    
    /**
     * Send control command
     */
    const sendControl = useCallback((targetPitch: number, targetRoll: number): void => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected, cannot send control');
            return;
        }
        
        const payload = new ArrayBuffer(CONTROL_SIZE);
        const view = new DataView(payload);
        view.setFloat32(0, targetPitch, true);
        view.setFloat32(4, targetRoll, true);
        
        const message = buildMessage(MSG_TYPE_CONTROL, new Uint8Array(payload));
        wsRef.current.send(message);
        
        console.log(`📤 Sent control: pitch=${targetPitch.toFixed(2)}°, roll=${targetRoll.toFixed(2)}°`);
    }, []);
    
    /**
     * Send PID update
     */
    const sendPIDUpdate = useCallback((
        axis: 0 | 1,
        kp: number,
        ki: number,
        kd: number,
        minLimit: number,
        maxLimit: number
    ): void => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected, cannot send PID update');
            return;
        }
        
        const payload = new ArrayBuffer(PID_UPDATE_SIZE);
        const view = new DataView(payload);
        view.setUint8(0, axis);
        view.setFloat32(1, kp, true);
        view.setFloat32(5, ki, true);
        view.setFloat32(9, kd, true);
        view.setFloat32(13, minLimit, true);
        view.setFloat32(17, maxLimit, true);
        // Padding (3 bytes)
        view.setUint8(21, 0);
        view.setUint8(22, 0);
        view.setUint8(23, 0);
        
        const message = buildMessage(MSG_TYPE_PID_UPDATE, new Uint8Array(payload));
        wsRef.current.send(message);
        
        console.log(`📤 Sent PID update: axis=${axis}, Kp=${kp}, Ki=${ki}, Kd=${kd}`);
    }, []);
    
    /**
     * Send heartbeat
     */
    const sendHeartbeat = useCallback((): void => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            return;
        }
        
        const payload = new ArrayBuffer(HEARTBEAT_SIZE);
        const view = new DataView(payload);
        view.setUint32(0, Date.now() & 0xFFFFFFFF, true);
        view.setUint32(4, heartbeatSequenceRef.current++, true);
        
        const message = buildMessage(MSG_TYPE_HEARTBEAT, new Uint8Array(payload));
        wsRef.current.send(message);
        
        console.debug('💓 Sent heartbeat');
    }, []);
    
    /**
     * Handle binary message
     */
    const handleMessage = useCallback((event: MessageEvent<Blob>): void => {
        if (!(event.data instanceof Blob)) {
            console.warn('Received non-binary message');
            return;
        }
        
        event.data.arrayBuffer().then((arrayBuffer) => {
            const uint8 = new Uint8Array(arrayBuffer);
            const view = new DataView(arrayBuffer);
            
            // Validate minimum size
            if (uint8.length < HEADER_SIZE + CRC_SIZE) {
                console.warn(`Message too small: ${uint8.length} bytes`);
                return;
            }
            
            // Parse header
            const magic = view.getUint16(0, true);
            const version = view.getUint8(2);
            const messageType = view.getUint8(3);
            const payloadLength = view.getUint16(4, true);
            
            // Validate header
            if (magic !== MAGIC_NUMBER || version !== PROTOCOL_VERSION) {
                console.warn(`Invalid header: magic=0x${magic.toString(16)}, version=${version}`);
                return;
            }
            
            // Validate size
            const expectedSize = HEADER_SIZE + payloadLength + CRC_SIZE;
            if (uint8.length !== expectedSize) {
                console.warn(`Size mismatch: expected ${expectedSize}, got ${uint8.length}`);
                return;
            }
            
            // Verify CRC
            const receivedCrc = view.getUint16(uint8.length - CRC_SIZE, true);
            const dataForCrc = uint8.slice(0, uint8.length - CRC_SIZE);
            const calculatedCrc = calculateCRC16(dataForCrc, dataForCrc.length);
            
            if (receivedCrc !== calculatedCrc) {
                console.warn(`CRC mismatch: received=0x${receivedCrc.toString(16)}, calculated=0x${calculatedCrc.toString(16)}`);
                return;
            }
            
            // Route by message type
            switch (messageType) {
                case MSG_TYPE_TELEMETRY:
                    if (payloadLength === TELEMETRY_SIZE) {
                        const telemetryData = parseTelemetry(view, HEADER_SIZE);
                        setTelemetry(telemetryData);
                    } else {
                        console.warn(`Invalid telemetry size: ${payloadLength}`);
                    }
                    break;
                    
                case MSG_TYPE_HEARTBEAT:
                    console.debug('💓 Received heartbeat');
                    break;
                    
                default:
                    console.warn(`Unknown message type: 0x${messageType.toString(16)}`);
            }
        }).catch((err) => {
            console.error('Error parsing binary message:', err);
        });
    }, []);
    
    /**
     * Connect to WebSocket
     */
    const connect = useCallback((): void => {
        if (wsRef.current?.readyState === WebSocket.OPEN || connectionState === 'connecting') {
            return;
        }
        
        setConnectionState('connecting');
        setError(null);
        
        try {
            const ws = new WebSocket(url);
            ws.binaryType = 'blob';
            
            ws.onopen = (): void => {
                console.log('✅ Gimbal WebSocket connected');
                setConnectionState('connected');
                setError(null);
                
                // Start heartbeat
                heartbeatIntervalRef.current = window.setInterval(() => {
                    sendHeartbeat();
                }, 5000);
            };
            
            ws.onmessage = handleMessage;
            
            ws.onerror = (event): void => {
                console.error('❌ WebSocket error:', event);
                setError('WebSocket connection error');
                setConnectionState('error');
            };
            
            ws.onclose = (): void => {
                console.warn('⚠️ Gimbal WebSocket closed');
                setConnectionState('disconnected');
                
                // Clear heartbeat
                if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                }
                
                // Auto-reconnect after 3 seconds
                if (!reconnectTimeoutRef.current) {
                    reconnectTimeoutRef.current = window.setTimeout(() => {
                        console.log('🔄 Reconnecting...');
                        reconnectTimeoutRef.current = null;
                        // Will reconnect via useEffect dependency
                    }, 3000);
                }
            };
            
            wsRef.current = ws;
        } catch (err) {
            console.error('Error creating WebSocket:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
            setConnectionState('error');
        }
    }, [url, connectionState, handleMessage, sendHeartbeat]);
    
    /**
     * Reconnect manually
     */
    const reconnect = useCallback((): void => {
        if (wsRef.current) {
            wsRef.current.close();
        }
        
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
        
        connect();
    }, [connect]);
    
    /**
     * Auto-connect on mount
     */
    useEffect(() => {
        // Use setTimeout to avoid direct setState in effect
        const timer = window.setTimeout(() => {
            if (connectionState === 'disconnected' && !reconnectTimeoutRef.current && !wsRef.current) {
                connect();
            }
        }, 0);
        
        return () => {
            window.clearTimeout(timer);
            
            // Cleanup on unmount
            if (wsRef.current) {
                wsRef.current.close();
            }
            
            if (reconnectTimeoutRef.current) {
                window.clearTimeout(reconnectTimeoutRef.current);
            }
            
            if (heartbeatIntervalRef.current) {
                window.clearInterval(heartbeatIntervalRef.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    return {
        telemetry,
        connectionState,
        error,
        sendControl,
        sendPIDUpdate,
        reconnect,
    };
};
