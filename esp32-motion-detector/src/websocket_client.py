"""
`websocket_client.py`
- WebSocket client for ESP32 camera server integration
- Receives frames, performs motion detection, sends analysis results

@author      Sim Woo-Keun <smileteeth14@gmail.com>
@date        2026-02-19 initial version

@copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
"""

import asyncio
import websockets
import json
import cv2
import numpy as np
from typing import Optional
from datetime import datetime
import logging
import base64

from types import MotionEvent, DetectionConfig, WebSocketMessage
from motion_detector import MotionDetector
from ai_analyzer import AIAnalyzer

# Namespace logging
NS = '\033[96m[WS]\033[0m'  # Cyan
_log = logging.getLogger(__name__)


class MotionDetectionClient:
    """
    WebSocket client that connects to camera server
    Receives frames and performs motion analysis
    """
    
    def __init__(self, server_url: str, config: DetectionConfig, api_key: Optional[str] = None):
        """
        Initialize motion detection client
        
        Args:
            server_url: WebSocket server URL (ws://localhost:8887)
            config: Detection configuration
            api_key: OpenAI API key for AI analysis
        """
        _log.info(f'{NS} MotionDetectionClient({server_url})...')
        self.server_url = server_url
        self.config = config
        
        self.detector = MotionDetector(config)
        self.analyzer = AIAnalyzer(api_key, use_openai=config.enable_ai_analysis and api_key is not None)
        
        self.websocket: Optional[websockets.WebSocketClientProtocol] = None
        self.running = False
        self.frame_count = 0
    
    async def connect(self) -> None:
        """Connect to WebSocket server"""
        try:
            _log.info(f'{NS} > Connecting to {self.server_url}...')
            self.websocket = await websockets.connect(
                self.server_url,
                extra_headers={'User-Agent': 'MotionDetector/1.0'}
            )
            self.running = True
            _log.info(f'{NS} > Connected successfully')
            
            # Send identification
            await self._send_message({
                'type': 'identify',
                'data': {
                    'role': 'motion_analyzer',
                    'version': '1.0.0',
                    'capabilities': ['motion_detection', 'ai_analysis']
                },
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            _log.error(f'{NS} ! Connection failed: {e}')
            raise
    
    async def disconnect(self) -> None:
        """Disconnect from server"""
        _log.info(f'{NS} > Disconnecting...')
        self.running = False
        if self.websocket:
            await self.websocket.close()
            self.websocket = None
        _log.info(f'{NS} > Disconnected')
    
    async def run(self) -> None:
        """Main event loop - receive and process frames"""
        try:
            await self.connect()
            
            _log.info(f'{NS} > Starting frame processing loop...')
            
            async for message in self.websocket:
                try:
                    if isinstance(message, bytes):
                        await self._process_frame(message)
                    else:
                        await self._process_text_message(message)
                        
                except Exception as e:
                    _log.error(f'{NS} ! Frame processing error: {e}')
                    
        except websockets.exceptions.ConnectionClosed:
            _log.warning(f'{NS} ! Connection closed by server')
        except Exception as e:
            _log.error(f'{NS} ! Run loop error: {e}')
        finally:
            await self.disconnect()
    
    async def _process_frame(self, frame_data: bytes) -> None:
        """
        Process received frame
        
        Args:
            frame_data: JPEG frame data
        """
        try:
            self.frame_count += 1
            
            # Decode JPEG to numpy array
            nparr = np.frombuffer(frame_data, np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if frame is None:
                _log.warning(f'{NS} ! Invalid frame received')
                return
            
            # Detect motion
            motion_level, change_pct, diff_frame = self.detector.detect_motion(frame)
            
            # Only analyze if significant motion detected
            if motion_level not in ['none', 'low'] and self.config.enable_ai_analysis:
                change_type, description, confidence = self.analyzer.analyze_change(frame, diff_frame)
                
                # Send analysis result to server
                await self._send_motion_event({
                    'frame_number': self.frame_count,
                    'motion_level': motion_level,
                    'change_percentage': round(change_pct, 2),
                    'change_type': change_type,
                    'description': description,
                    'confidence': round(confidence, 2),
                    'timestamp': datetime.now().isoformat()
                })
                
                # Save snapshot if enabled
                if self.config.save_snapshots:
                    self._save_snapshot(frame, diff_frame, motion_level)
                    
        except Exception as e:
            _log.error(f'{NS} ! _process_frame() error: {e}')
    
    async def _process_text_message(self, message: str) -> None:
        """
        Process text message from server
        
        Args:
            message: JSON message
        """
        try:
            data = json.loads(message)
            msg_type = data.get('type', '')
            
            if msg_type == 'ping':
                await self._send_message({
                    'type': 'pong',
                    'data': {},
                    'timestamp': datetime.now().isoformat()
                })
            elif msg_type == 'config':
                _log.info(f'{NS} > Received config update: {data}')
            else:
                _log.debug(f'{NS} > Text message: {msg_type}')
                
        except json.JSONDecodeError as e:
            _log.warning(f'{NS} ! Invalid JSON message: {e}')
    
    async def _send_message(self, message: WebSocketMessage) -> None:
        """
        Send JSON message to server
        
        Args:
            message: Message to send
        """
        try:
            if self.websocket:
                await self.websocket.send(json.dumps(message))
        except Exception as e:
            _log.error(f'{NS} ! _send_message() error: {e}')
    
    async def _send_motion_event(self, event_data: dict) -> None:
        """
        Send motion detection event to server
        
        Args:
            event_data: Motion event data
        """
        _log.info(f'{NS} > Sending motion event: {event_data["motion_level"]} ({event_data["change_percentage"]}%)')
        
        await self._send_message({
            'type': 'motion_event',
            'data': event_data,
            'timestamp': datetime.now().isoformat()
        })
    
    def _save_snapshot(self, frame: np.ndarray, diff_frame: np.ndarray, motion_level: str) -> None:
        """
        Save snapshot of motion event
        
        Args:
            frame: Original frame
            diff_frame: Difference frame
            motion_level: Motion level classification
        """
        try:
            import os
            os.makedirs(self.config.snapshot_dir, exist_ok=True)
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'{self.config.snapshot_dir}/motion_{timestamp}_{motion_level}.jpg'
            
            # Combine original and diff side-by-side
            combined = np.hstack([frame, diff_frame])
            cv2.imwrite(filename, combined)
            
            _log.info(f'{NS} > Snapshot saved: {filename}')
            
        except Exception as e:
            _log.error(f'{NS} ! _save_snapshot() error: {e}')
    
    def get_stats(self) -> dict:
        """Get client statistics"""
        return {
            'connected': self.running,
            'frame_count': self.frame_count,
            'detector_stats': self.detector.get_stats(),
            'analyzer_stats': self.analyzer.get_stats()
        }
