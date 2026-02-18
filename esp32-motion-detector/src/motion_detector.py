"""
`motion_detector.py`
- OpenCV-based motion detection module
- Detects frame changes and quantifies motion level

@author      Sim Si-Geun <sim@granule.io>
@date        2026-02-19 initial version

@copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
"""

import cv2
import numpy as np
from typing import Optional, Tuple
from datetime import datetime
import logging

from motion_types import MotionEvent, MotionLevel, DetectionConfig

# Namespace logging
NS = '\033[93m[MOTION]\033[0m'  # Yellow
_log = logging.getLogger(__name__)


class MotionDetector:
    """
    OpenCV-based motion detection
    Compares consecutive frames to detect changes
    """
    
    def __init__(self, config: DetectionConfig):
        """
        Initialize motion detector
        
        Args:
            config: Detection configuration
        """
        _log.info(f'{NS} MotionDetector(threshold={config.threshold})...')
        self.config = config
        self.previous_frame: Optional[np.ndarray] = None
        self.frame_count = 0
        
    def detect_motion(self, frame: np.ndarray) -> Tuple[MotionLevel, float, Optional[np.ndarray]]:
        """
        Detect motion in current frame
        
        Args:
            frame: Current frame (BGR format)
            
        Returns:
            Tuple of (motion_level, change_percentage, diff_frame)
        """
        try:
            self.frame_count += 1
            
            # Convert to grayscale and blur
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (self.config.blur_size, self.config.blur_size), 0)
            
            # First frame initialization
            if self.previous_frame is None:
                _log.info(f'{NS} > First frame initialized')
                self.previous_frame = blurred
                return ('none', 0.0, None)
            
            # Calculate frame difference
            frame_delta = cv2.absdiff(self.previous_frame, blurred)
            thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]
            
            # Dilate to fill holes
            thresh = cv2.dilate(thresh, None, iterations=2)
            
            # Calculate change percentage
            total_pixels = thresh.shape[0] * thresh.shape[1]
            changed_pixels = np.count_nonzero(thresh)
            change_percentage = (changed_pixels / total_pixels) * 100
            
            # Determine motion level
            motion_level = self._calculate_motion_level(change_percentage)
            
            # Find contours for visualization
            contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            # Draw contours on diff frame
            diff_frame = cv2.cvtColor(frame_delta, cv2.COLOR_GRAY2BGR)
            for contour in contours:
                if cv2.contourArea(contour) < self.config.min_contour_area:
                    continue
                (x, y, w, h) = cv2.boundingRect(contour)
                cv2.rectangle(diff_frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            
            # Update previous frame
            self.previous_frame = blurred
            
            if motion_level != 'none':
                _log.info(f'{NS} > Motion detected: {motion_level} ({change_percentage:.2f}%)')
            
            return (motion_level, change_percentage, diff_frame)
            
        except Exception as e:
            _log.error(f'{NS} ! detect_motion() error: {e}')
            return ('none', 0.0, None)
    
    def _calculate_motion_level(self, change_percentage: float) -> MotionLevel:
        """
        Calculate motion level from change percentage
        
        Args:
            change_percentage: Percentage of changed pixels
            
        Returns:
            Motion level classification
        """
        if change_percentage < 0.5:
            return 'none'
        elif change_percentage < 2.0:
            return 'low'
        elif change_percentage < 5.0:
            return 'medium'
        elif change_percentage < 10.0:
            return 'high'
        else:
            return 'critical'
    
    def reset(self) -> None:
        """Reset detector state"""
        _log.info(f'{NS} reset()...')
        self.previous_frame = None
        self.frame_count = 0
    
    def get_stats(self) -> dict:
        """Get detector statistics"""
        return {
            'frame_count': self.frame_count,
            'has_reference': self.previous_frame is not None,
            'threshold': self.config.threshold
        }
