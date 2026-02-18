/**
 * `IoTDashboard.tsx`
 * - Real-time IoT monitoring dashboard showcasing ESP32-CAM project
 *
 * @author      Sim Si-Myeong <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Camera, Activity, Power, Rotate3D, Shield, Users, Wifi, WifiOff } from 'lucide-react';

// Mock sensor data
const generateSensorData = () => {
  const data = [];
  for (let i = 0; i < 20; i++) {
    data.push({
      time: `${i}s`,
      temperature: Math.floor(Math.random() * 10) + 20,
      viewers: Math.floor(Math.random() * 5) + 1,
    });
  }
  return data;
};

export const IoTDashboard = () => {
  const [ledStatus, setLedStatus] = useState(false);
  const [motorAngle, setMotorAngle] = useState(90);
  const [sensorData] = useState(generateSensorData());
  const [wsConnected, setWsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // WebSocket server URL (EC2 instance)
  const WS_URL = 'ws://52.79.241.244/ws/viewer';

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('WebSocket connected');
          setWsConnected(true);
        };

        ws.onmessage = (event) => {
          // Blob 데이터를 받아서 이미지로 변환
          if (event.data instanceof Blob) {
            const url = URL.createObjectURL(event.data);
            if (imgRef.current) {
              const oldUrl = imgRef.current.src;
              imgRef.current.src = url;
              // 메모리 누수 방지를 위해 이전 URL 해제
              if (oldUrl.startsWith('blob:')) {
                URL.revokeObjectURL(oldUrl);
              }
            }
          } else if (typeof event.data === 'string') {
            // 텍스트 메시지 처리 (viewer count 등)
            try {
              const data = JSON.parse(event.data);
              if (data.viewers !== undefined) {
                setViewerCount(data.viewers);
              }
            } catch (e) {
              console.log('Non-JSON message:', event.data);
            }
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setWsConnected(false);
        };

        ws.onclose = () => {
          console.log('WebSocket disconnected');
          setWsConnected(false);
          // 3초 후 재연결 시도
          setTimeout(connectWebSocket, 3000);
        };
      } catch (error) {
        console.error('WebSocket connection error:', error);
        setWsConnected(false);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // LED 제어
  const handleLedToggle = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'control', 
        action: 'led', 
        value: !ledStatus 
      }));
      setLedStatus(!ledStatus);
    }
  };

  // Motor 제어
  const handleMotorChange = (angle: number) => {
    setMotorAngle(angle);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ 
        type: 'control', 
        action: 'motor', 
        value: angle 
      }));
    }
  };

  return (
    <section id="iot-project" className="section-container bg-gradient-to-b from-gray-950 to-gray-900">
      <div className="mb-12">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Camera className="w-8 h-8 text-primary-400" />
          <h2 className="text-3xl md:text-4xl font-bold">
            Real-time <span className="text-primary-400">IoT Monitoring</span>
          </h2>
        </div>
        <p className="text-center text-gray-400 max-w-2xl mx-auto">
          ESP32-CAM 기반 실시간 영상 스트리밍 및 제어 시스템<br />
          WebSocket, Race Condition 방지, 자동 버전 관리 적용
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Stream Area */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Wifi className="w-5 h-5 text-green-500" />
              Live Stream
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full ml-2">
                ONLINE
              </span>
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>{sensorData[sensorData.length - 1]?.viewers || 1} viewers</span>
            </div>
          </div>

          {/* Video Placeholder */}
          <div className="relative aspect-video bg-gray-950 rounded-lg overflow-hidden border border-gray-800 mb-4">
            {wsConnected ? (
              <img 
                ref={imgRef}
                alt="ESP32-CAM Stream" 
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <WifiOff className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-600">WebSocket 연결 대기 중...</p>
                  <p className="text-sm text-gray-700 mt-2">{WS_URL}</p>
                </div>
              </div>
            )}
            
            {/* Connection Status */}
            <div className="absolute top-4 right-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                wsConnected 
                  ? 'bg-green-500/20 border border-green-500/50' 
                  : 'bg-red-500/20 border border-red-500/50'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                }`} />
                <span className={`text-xs font-medium ${
                  wsConnected ? 'text-green-400' : 'text-red-400'
                }`}>
                  {wsConnected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
            </div>

            {/* Viewer Count */}
            {wsConnected && (
              <div className="absolute top-4 left-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-700">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-medium text-gray-300">
                    시청자 {viewerCount}명
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Resolution</p>
              <p className="text-lg font-semibold">1024×768</p>
            </div>
            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">FPS</p>
              <p className="text-lg font-semibold">30 fps</p>
            </div>
            <div className="bg-gray-950 p-4 rounded-lg border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Latency</p>
              <p className="text-lg font-semibold text-green-400">45ms</p>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          {/* Hardware Control */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Power className="w-5 h-5 text-primary-400" />
              Hardware Control
            </h3>

            {/* LED Control */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400">LED Status</span>
                <button
                  onClick={handleLedToggle}
                  disabled={!wsConnected}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    ledStatus ? 'bg-primary-600' : 'bg-gray-700'
                  } ${!wsConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      ledStatus ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <div className="text-xs text-gray-600">
                {ledStatus ? 'LED ON' : 'LED OFF'}
              </div>
            </div>

            {/* Motor Control */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-400 flex items-center gap-2">
                  <Rotate3D className="w-4 h-4" />
                  Servo Angle
                </span>
                <span className="text-primary-400 font-semibold">{motorAngle}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="180"
                value={motorAngle}
                onChange={(e) => handleMotorChange(Number(e.target.value))}
                disabled={!wsConnected}
                className={`w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600 ${
                  !wsConnected ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0°</span>
                <span>90°</span>
                <span>180°</span>
              </div>
            </div>
          </div>

          {/* AI Status */}
          <div className="card bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-800/50">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              AI System
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Anomaly Detection</span>
            </div>
            <p className="text-xs text-gray-500">실시간 이상 감지 가동 중</p>
          </div>

          {/* System Info */}
          <div className="card">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-400" />
              System Info
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Version</span>
                <span className="text-gray-300 font-mono">v1.1.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Uptime</span>
                <span className="text-gray-300">2d 14h 26m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Memory</span>
                <span className="text-green-400">82% free</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor Data Visualization */}
      <div className="card mt-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-400" />
          Real-time Sensor Data
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={sensorData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="time" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
              }}
            />
            <Line type="monotone" dataKey="temperature" stroke="#0EA5E9" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="viewers" stroke="#10B981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Tech Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="card text-center">
          <div className="text-primary-400 font-bold text-2xl mb-2">WebSocket</div>
          <p className="text-sm text-gray-500">실시간 양방향 통신</p>
        </div>
        <div className="card text-center">
          <div className="text-primary-400 font-bold text-2xl mb-2">Race Condition</div>
          <p className="text-sm text-gray-500">다중 제어권 충돌 방지</p>
        </div>
        <div className="card text-center">
          <div className="text-primary-400 font-bold text-2xl mb-2">Auto Versioning</div>
          <p className="text-sm text-gray-500">Git Hook 기반 자동화</p>
        </div>
      </div>
    </section>
  );
};
