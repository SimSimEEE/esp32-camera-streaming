/**
 * `CameraViewer.tsx`
 * - ESP32-CAM real-time streaming viewer component
 *
 * @author      Sim Si-Myeong <sim@granule.io>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

import { useState, useEffect, useRef } from 'react';
import { Camera, Wifi, WifiOff, Activity, TrendingUp, Maximize2, Power, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SensorData {
  time: string;
  fps: number;
  dataRate: number;
}

export const CameraViewer = () => {
  const [wsConnected, setWsConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [ledStatus, setLedStatus] = useState(false);
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);
  const [resolution, setResolution] = useState({ width: 0, height: 0 });
  const [dataReceived, setDataReceived] = useState(0);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  
  const clientVersion = '1.2.0';
  const [serverVersion, setServerVersion] = useState('-');
  const [firmwareVersion, setFirmwareVersion] = useState('-');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const fpsCounterRef = useRef({ count: 0, lastTime: Date.now() });

  const WS_URL = 'ws://52.79.241.244/ws/viewer';

  useEffect(() => {
    connectWebSocket();
    const fpsInterval = setInterval(updateFPS, 1000);
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      clearInterval(fpsInterval);
    };
  }, []);

  const updateFPS = () => {
    const now = Date.now();
    const elapsed = (now - fpsCounterRef.current.lastTime) / 1000;
    const currentFps = Math.round(fpsCounterRef.current.count / elapsed);
    setFps(currentFps);
    
    // Update sensor data for chart
    setSensorData(prev => {
      const newData = [...prev, {
        time: new Date().toLocaleTimeString(),
        fps: currentFps,
        dataRate: dataReceived / 1024, // KB
      }].slice(-20); // Keep last 20 data points
      return newData;
    });
    
    fpsCounterRef.current = { count: 0, lastTime: now };
  };

  const connectWebSocket = () => {
    try {
      const ws = new WebSocket(WS_URL);
      ws.binaryType = 'arraybuffer';
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket connected');
        setWsConnected(true);
        
        // Request LED status
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send('LED_STATUS');
          }
        }, 500);
      };

      ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          handleImageFrame(event.data);
        } else {
          handleTextMessage(event.data);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setWsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setWsConnected(false);
        // Retry connection after 3 seconds
        setTimeout(connectWebSocket, 3000);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setWsConnected(false);
    }
  };

  const handleImageFrame = (data: ArrayBuffer) => {
    fpsCounterRef.current.count++;
    setFrameCount(prev => prev + 1);
    setDataReceived(prev => prev + data.byteLength);

    const blob = new Blob([data], { type: 'image/jpeg' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== img.width || canvas.height !== img.height) {
        canvas.width = img.width;
        canvas.height = img.height;
        setResolution({ width: img.width, height: img.height });
      }

      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  const handleTextMessage = (message: string) => {
    console.log('Message:', message);

    if (message.startsWith('VIEWERS_COUNT:')) {
      const count = parseInt(message.split(':')[1]);
      setViewerCount(count);
    } else if (message.startsWith('VERSION_INFO:')) {
      const versionData = message.substring('VERSION_INFO:'.length);
      // Parse version data (format: "server:1.2.0,firmware:1.0.0")
      const versions = versionData.split(',');
      versions.forEach(v => {
        const [key, value] = v.split(':');
        if (key === 'server') setServerVersion(value);
        if (key === 'firmware') setFirmwareVersion(value);
      });
    } else if (message === 'LED_ON') {
      setLedStatus(true);
    } else if (message === 'LED_OFF') {
      setLedStatus(false);
    } else if (message.startsWith('LED_STATUS:')) {
      const status = message.split(':')[1];
      setLedStatus(status === 'ON');
    }
  };

  const handleLedToggle = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const command = ledStatus ? 'LED_OFF' : 'LED_ON';
      wsRef.current.send(command);
    }
  };

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  return (
    <div className="section-container bg-gradient-to-b from-gray-950 to-gray-900">
      {/* Section Header */}
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

      {/* Status Bar */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Viewer Count */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/50 border border-gray-700">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-gray-300">
            시청자 {viewerCount}명
          </span>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
          wsConnected 
            ? 'bg-green-500/20 border border-green-500/50' 
            : 'bg-red-500/20 border border-red-500/50'
        }`}>
          {wsConnected ? (
            <Wifi className="w-4 h-4 text-green-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm font-medium ${
            wsConnected ? 'text-green-400' : 'text-red-400'
          }`}>
            {wsConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Stream */}
          <div className="lg:col-span-2 space-y-6">
            {/* Canvas */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="relative aspect-video bg-gray-950">
                {!wsConnected && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <WifiOff className="w-16 h-16 text-gray-700 mb-4" />
                    <p className="text-gray-600">WebSocket 연결 대기 중...</p>
                    <p className="text-sm text-gray-700 mt-2">{WS_URL}</p>
                  </div>
                )}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full object-contain"
                />
              </div>
              
              {/* Stream Stats */}
              <div className="grid grid-cols-4 gap-4 p-4 bg-gray-950 border-t border-gray-800">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Resolution</p>
                  <p className="text-sm font-semibold text-gray-300">
                    {resolution.width > 0 ? `${resolution.width}×${resolution.height}` : '-'}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">FPS</p>
                  <p className="text-sm font-semibold text-green-400">{fps} fps</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Frames</p>
                  <p className="text-sm font-semibold text-gray-300">{frameCount.toLocaleString()}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Data</p>
                  <p className="text-sm font-semibold text-gray-300">
                    {(dataReceived / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
            </div>

            {/* Performance Chart */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary-400" />
                Performance Metrics
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={sensorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line type="monotone" dataKey="fps" stroke="#10B981" strokeWidth={2} name="FPS" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Hardware Control */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Power className="w-5 h-5 text-primary-400" />
                Hardware Control
              </h3>

              {/* LED Control */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    LED Status
                  </span>
                  <button
                    onClick={handleLedToggle}
                    disabled={!wsConnected}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      ledStatus ? 'bg-primary-600' : 'bg-gray-700'
                    } ${!wsConnected ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        ledStatus ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="text-xs text-gray-600">
                  {ledStatus ? '💡 LED ON' : '🔘 LED OFF'}
                </div>
              </div>

              {/* Connection Control */}
              <div className="mt-6 pt-6 border-t border-gray-800">
                <button
                  onClick={handleDisconnect}
                  disabled={!wsConnected}
                  className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg border border-red-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  연결 해제
                </button>
              </div>
            </div>

            {/* Version Info */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Maximize2 className="w-5 h-5 text-primary-400" />
                System Info
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">🌐 Client</span>
                  <span className="text-gray-300 font-mono">{clientVersion}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">🖥️ Server</span>
                  <span className="text-gray-300 font-mono">{serverVersion}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">📟 Firmware</span>
                  <span className="text-gray-300 font-mono">{firmwareVersion}</span>
                </div>
              </div>
            </div>

            {/* Powered By */}
            <div className="bg-gradient-to-br from-primary-900/20 to-cyan-900/20 rounded-xl border border-primary-500/20 p-6">
              <p className="text-sm text-gray-400 text-center">
                Powered by <span className="text-primary-400 font-semibold">Granule Core</span>
                <br />
                <span className="text-xs text-gray-500">ESP32-CAM WebSocket Streaming</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CameraViewer;
