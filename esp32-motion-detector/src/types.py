"""
`types.py`
- Type definitions for motion detection service

@author      Sim Woo-Keun <smileteeth14@gmail.com>
@date        2026-02-19 initial version

@copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
"""

from typing import TypedDict, Literal, Optional
from dataclasses import dataclass
from datetime import datetime

# Lookup Table (LUT)
LUT = {
    'MotionLevel': {
        'none': '변화 없음',
        'low': '낮은 변화',
        'medium': '중간 변화',
        'high': '높은 변화',
        'critical': '심각한 변화'
    },
    'ChangeType': {
        'person': '사람 감지',
        'object': '물체 이동',
        'light': '조명 변화',
        'camera': '카메라 흔들림',
        'unknown': '알 수 없음'
    }
}

# Type Exports
MotionLevel = Literal['none', 'low', 'medium', 'high', 'critical']
ChangeType = Literal['person', 'object', 'light', 'camera', 'unknown']


@dataclass
class MotionEvent:
    """Motion detection event data"""
    timestamp: datetime
    level: MotionLevel
    change_percentage: float
    change_type: Optional[ChangeType]
    ai_description: Optional[str]
    confidence: float
    frame_diff: Optional[bytes]


@dataclass
class DetectionConfig:
    """Configuration for motion detection"""
    threshold: float = 0.1  # 10% change threshold
    blur_size: int = 21
    min_contour_area: int = 500
    enable_ai_analysis: bool = True
    ai_analysis_cooldown: int = 3  # seconds between AI analyses
    save_snapshots: bool = True
    snapshot_dir: str = './snapshots'


class WebSocketMessage(TypedDict):
    """WebSocket message format"""
    type: str
    data: dict
    timestamp: str
