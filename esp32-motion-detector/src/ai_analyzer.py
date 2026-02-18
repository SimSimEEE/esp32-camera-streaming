"""
`ai_analyzer.py`
- AI-based change reason analysis
- Uses OpenAI Vision API or local models to analyze motion

@author      Sim Woo-Keun <smileteeth14@gmail.com>
@date        2026-02-19 initial version

@copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
"""

import cv2
import numpy as np
import base64
from typing import Optional, Tuple
from datetime import datetime, timedelta
import logging
import os

from motion_types import ChangeType

# Namespace logging
NS = '\033[95m[AI]\033[0m'  # Magenta
_log = logging.getLogger(__name__)


class AIAnalyzer:
    """
    AI-based motion reason analyzer
    Analyzes frames to determine cause of motion
    """
    
    def __init__(self, api_key: Optional[str] = None, use_openai: bool = True):
        """
        Initialize AI analyzer
        
        Args:
            api_key: OpenAI API key (optional)
            use_openai: Use OpenAI API if True, else use local heuristics
        """
        _log.info(f'{NS} AIAnalyzer(use_openai={use_openai})...')
        self.use_openai = use_openai and api_key is not None
        self.api_key = api_key
        self.last_analysis_time = None
        self.cooldown = timedelta(seconds=3)
        
        if self.use_openai:
            try:
                import openai
                self.openai = openai
                self.openai.api_key = api_key
                _log.info(f'{NS} > OpenAI API configured')
            except ImportError:
                _log.warning(f'{NS} ! OpenAI package not installed, using local heuristics')
                self.use_openai = False
    
    def analyze_change(self, frame: np.ndarray, diff_frame: np.ndarray) -> Tuple[ChangeType, str, float]:
        """
        Analyze the cause of motion
        
        Args:
            frame: Current frame (BGR)
            diff_frame: Difference frame with contours
            
        Returns:
            Tuple of (change_type, description, confidence)
        """
        try:
            # Check cooldown
            if self.last_analysis_time is not None:
                elapsed = datetime.now() - self.last_analysis_time
                if elapsed < self.cooldown:
                    return ('unknown', 'Cooldown active', 0.0)
            
            self.last_analysis_time = datetime.now()
            
            if self.use_openai:
                return self._analyze_with_openai(frame, diff_frame)
            else:
                return self._analyze_with_heuristics(frame, diff_frame)
                
        except Exception as e:
            _log.error(f'{NS} ! analyze_change() error: {e}')
            return ('unknown', f'Analysis error: {str(e)}', 0.0)
    
    def _analyze_with_openai(self, frame: np.ndarray, diff_frame: np.ndarray) -> Tuple[ChangeType, str, float]:
        """
        Use OpenAI Vision API to analyze change
        
        Args:
            frame: Current frame
            diff_frame: Difference frame
            
        Returns:
            Analysis result
        """
        try:
            _log.info(f'{NS} > Analyzing with OpenAI Vision API...')
            
            # Encode frame to base64
            _, buffer = cv2.imencode('.jpg', frame)
            img_base64 = base64.b64encode(buffer).decode('utf-8')
            
            # Call OpenAI Vision API
            response = self.openai.ChatCompletion.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": "이 이미지에서 어떤 변화가 감지되었습니다. 변화의 원인을 간단히 설명해주세요. (사람, 물체, 조명 변화, 카메라 흔들림 등)"
                            },
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/jpeg;base64,{img_base64}"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=100
            )
            
            description = response.choices[0].message.content
            
            # Classify change type from description
            change_type = self._classify_from_description(description)
            
            _log.info(f'{NS} > AI Analysis: {change_type} - {description}')
            
            return (change_type, description, 0.85)
            
        except Exception as e:
            _log.error(f'{NS} ! OpenAI API error: {e}')
            return self._analyze_with_heuristics(frame, diff_frame)
    
    def _analyze_with_heuristics(self, frame: np.ndarray, diff_frame: np.ndarray) -> Tuple[ChangeType, str, float]:
        """
        Use local image processing heuristics
        
        Args:
            frame: Current frame
            diff_frame: Difference frame
            
        Returns:
            Analysis result
        """
        _log.info(f'{NS} > Analyzing with local heuristics...')
        
        # Calculate brightness change
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        avg_brightness = np.mean(gray)
        
        # Find contours in diff
        gray_diff = cv2.cvtColor(diff_frame, cv2.COLOR_BGR2GRAY)
        contours, _ = cv2.findContours(gray_diff, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if not contours:
            return ('unknown', '변화 감지됨 (상세 분석 불가)', 0.3)
        
        # Analyze largest contour
        largest_contour = max(contours, key=cv2.contourArea)
        area = cv2.contourArea(largest_contour)
        x, y, w, h = cv2.boundingRect(largest_contour)
        aspect_ratio = w / h if h > 0 else 0
        
        # Heuristic classification
        if 0.3 < aspect_ratio < 2.5 and area > 2000:
            # Roughly person-shaped
            return ('person', f'사람 형태 감지 (크기: {int(area)})', 0.6)
        elif area < 1000:
            return ('camera', '카메라 흔들림 또는 노이즈', 0.5)
        elif avg_brightness > 200 or avg_brightness < 50:
            return ('light', f'조명 변화 감지 (밝기: {int(avg_brightness)})', 0.7)
        else:
            return ('object', f'물체 이동 감지 (크기: {int(area)})', 0.5)
    
    def _classify_from_description(self, description: str) -> ChangeType:
        """
        Classify change type from AI description
        
        Args:
            description: AI-generated description
            
        Returns:
            Change type classification
        """
        desc_lower = description.lower()
        
        if any(word in desc_lower for word in ['사람', 'person', '인물', '남자', '여자']):
            return 'person'
        elif any(word in desc_lower for word in ['조명', 'light', '밝기', '어두움', '빛']):
            return 'light'
        elif any(word in desc_lower for word in ['흔들림', 'shake', '진동', 'vibration']):
            return 'camera'
        elif any(word in desc_lower for word in ['물체', 'object', '이동', 'movement']):
            return 'object'
        else:
            return 'unknown'
    
    def get_stats(self) -> dict:
        """Get analyzer statistics"""
        return {
            'use_openai': self.use_openai,
            'last_analysis': self.last_analysis_time.isoformat() if self.last_analysis_time else None,
            'cooldown_seconds': self.cooldown.total_seconds()
        }
