"""
`test_motion_detector.py`
- Unit tests for motion detection module

@author      Sim Si-Geun <sim@granule.io>
@date        2026-02-19 initial version

@copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

import cv2
import numpy as np
import pytest
from types import DetectionConfig
from motion_detector import MotionDetector


class TestMotionDetector:
    """Test suite for MotionDetector class"""
    
    def setup_method(self):
        """Setup test fixtures"""
        self.config = DetectionConfig(
            threshold=0.1,
            blur_size=21,
            min_contour_area=500
        )
        self.detector = MotionDetector(self.config)
    
    def test_initialization(self):
        """Test detector initialization"""
        assert self.detector.config.threshold == 0.1
        assert self.detector.previous_frame is None
        assert self.detector.frame_count == 0
    
    def test_first_frame(self):
        """Test first frame processing"""
        # Create a test frame
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        
        level, change_pct, diff = self.detector.detect_motion(frame)
        
        assert level == 'none'
        assert change_pct == 0.0
        assert diff is None
        assert self.detector.previous_frame is not None
    
    def test_no_motion(self):
        """Test identical frames (no motion)"""
        frame1 = np.ones((480, 640, 3), dtype=np.uint8) * 128
        frame2 = frame1.copy()
        
        self.detector.detect_motion(frame1)
        level, change_pct, diff = self.detector.detect_motion(frame2)
        
        assert level == 'none'
        assert change_pct < 0.5
    
    def test_significant_motion(self):
        """Test significant frame difference"""
        # Black frame
        frame1 = np.zeros((480, 640, 3), dtype=np.uint8)
        
        # White square in center
        frame2 = np.zeros((480, 640, 3), dtype=np.uint8)
        frame2[200:280, 270:370] = 255
        
        self.detector.detect_motion(frame1)
        level, change_pct, diff = self.detector.detect_motion(frame2)
        
        assert level in ['medium', 'high', 'critical']
        assert change_pct > 1.0
        assert diff is not None
    
    def test_motion_level_classification(self):
        """Test motion level classification"""
        assert self.detector._calculate_motion_level(0.3) == 'none'
        assert self.detector._calculate_motion_level(1.0) == 'low'
        assert self.detector._calculate_motion_level(3.0) == 'medium'
        assert self.detector._calculate_motion_level(7.0) == 'high'
        assert self.detector._calculate_motion_level(15.0) == 'critical'
    
    def test_reset(self):
        """Test detector reset"""
        frame = np.zeros((480, 640, 3), dtype=np.uint8)
        self.detector.detect_motion(frame)
        
        assert self.detector.frame_count > 0
        assert self.detector.previous_frame is not None
        
        self.detector.reset()
        
        assert self.detector.frame_count == 0
        assert self.detector.previous_frame is None
    
    def test_get_stats(self):
        """Test statistics retrieval"""
        stats = self.detector.get_stats()
        
        assert 'frame_count' in stats
        assert 'has_reference' in stats
        assert 'threshold' in stats
        assert stats['threshold'] == 0.1


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
