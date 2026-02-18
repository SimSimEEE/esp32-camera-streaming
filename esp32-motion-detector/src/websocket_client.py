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

from motion_types import MotionEvent, DetectionConfig, WebSocketMessage
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
        # Ensure URL ends with /analyzer endpoint
        if not server_url.endswith('/analyzer'):
            server_url = server_url.rstrip('/') + '/analyzer'
        
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
            motion_level, change_pct, diff_frame, annotated_frame, contours = self.detector.detect_motion(frame)
            
            # Send debug info every frame
            await self._send_debug_info({
                'frame_number': self.frame_count,
                'motion_level': motion_level,
                'change_percentage': round(change_pct, 2),
                'frame_size': f'{frame.shape[1]}x{frame.shape[0]}',
                'timestamp': datetime.now().isoformat()
            })
            
            # Only analyze if significant motion detected
            if motion_level not in ['none', 'low'] and self.config.enable_ai_analysis:
                change_type, description, confidence = self.analyzer.analyze_change(frame, diff_frame)

                # Redraw contours on annotated_frame with change_type-specific color
                COLOR_MAP = {
                    'person': (0, 0, 255),    # Red
                    'light':  (0, 255, 255),  # Yellow
                    'object': (255, 165, 0),  # Orange
                    'camera': (255, 0, 255),  # Magenta
                    'unknown': (128, 128, 128),  # Gray
                }
                border_color = COLOR_MAP.get(change_type, (0, 255, 0))
                labeled_frame = frame.copy()
                for contour in contours:
                    (cx, cy, cw, ch) = cv2.boundingRect(contour)
                    cv2.rectangle(labeled_frame, (cx, cy), (cx + cw, cy + ch), border_color, 2)
                # Draw label on top-left corner
                label_text = f'{change_type.upper()} ({int(confidence * 100)}%)'
                (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                cv2.rectangle(labeled_frame, (8, 8), (8 + tw + 8, 8 + th + 10), border_color, -1)
                cv2.putText(labeled_frame, label_text, (12, 8 + th + 2),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
                # Motion level badge
                level_text = f'{motion_level} {change_pct:.1f}%'
                cv2.putText(labeled_frame, level_text, (12, labeled_frame.shape[0] - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, border_color, 1)
                
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
                    self._save_snapshot(labeled_frame, diff_frame, motion_level, change_type)
                    
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
    
    async def _send_debug_info(self, debug_data: dict) -> None:
        """
        Send debug information to server
        
        Args:
            debug_data: Debug information
        """
        await self._send_message({
            'type': 'motion_debug',
            'data': debug_data,
            'timestamp': datetime.now().isoformat()
        })
    
    def _save_snapshot(self, frame: np.ndarray, diff_frame: np.ndarray, motion_level: str, change_type: str = 'unknown') -> None:
        """
        Save snapshot of motion event

        Args:
            frame: Annotated frame with bounding boxes (or original if no annotation)
            diff_frame: Difference frame
            motion_level: Motion level classification
            change_type: AI-classified change type (person/light/object/camera/unknown)
        """
        try:
            import os
            os.makedirs(self.config.snapshot_dir, exist_ok=True)

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f'{self.config.snapshot_dir}/motion_{timestamp}_{motion_level}_{change_type}.jpg'

            # Combine annotated original and diff side-by-side
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
