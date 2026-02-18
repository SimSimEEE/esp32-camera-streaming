"""
`main.py`
- Main entry point for motion detection service
- Starts WebSocket client and motion analysis

@author      Sim Woo-Keun <smileteeth14@gmail.com>
@date        2026-02-19 initial version

@copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
"""

import asyncio
import logging
import os
import signal
import sys
from typing import Optional

from types import DetectionConfig
from websocket_client import MotionDetectionClient

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler('motion_detector.log')
    ]
)

NS = '\033[92m[MAIN]\033[0m'  # Green
_log = logging.getLogger(__name__)


class MotionDetectionService:
    """
    Main service coordinator
    Manages lifecycle of motion detection client
    """
    
    def __init__(self):
        """Initialize service"""
        _log.info(f'{NS} MotionDetectionService()...')
        
        # Load configuration from environment
        self.config = self._load_config()
        self.client: Optional[MotionDetectionClient] = None
        self.running = False
    
    def _load_config(self) -> DetectionConfig:
        """
        Load configuration from environment variables
        
        Returns:
            Detection configuration
        """
        return DetectionConfig(
            threshold=float(os.getenv('MOTION_THRESHOLD', '0.1')),
            blur_size=int(os.getenv('BLUR_SIZE', '21')),
            min_contour_area=int(os.getenv('MIN_CONTOUR_AREA', '500')),
            enable_ai_analysis=os.getenv('ENABLE_AI', 'true').lower() == 'true',
            ai_analysis_cooldown=int(os.getenv('AI_COOLDOWN', '3')),
            save_snapshots=os.getenv('SAVE_SNAPSHOTS', 'true').lower() == 'true',
            snapshot_dir=os.getenv('SNAPSHOT_DIR', './snapshots')
        )
    
    async def start(self) -> None:
        """Start the service"""
        try:
            _log.info(f'{NS} > Starting service...')
            
            # Configuration summary
            _log.info(f'{NS} > Configuration:')
            _log.info(f'{NS}   - Threshold: {self.config.threshold}')
            _log.info(f'{NS}   - AI Analysis: {self.config.enable_ai_analysis}')
            _log.info(f'{NS}   - Save Snapshots: {self.config.save_snapshots}')
            
            # Get server URL
            server_url = os.getenv('WEBSOCKET_SERVER', 'ws://localhost:8887')
            api_key = os.getenv('OPENAI_API_KEY')
            
            if not api_key and self.config.enable_ai_analysis:
                _log.warning(f'{NS} ! No OpenAI API key provided, using local heuristics')
            
            # Create and run client
            self.client = MotionDetectionClient(server_url, self.config, api_key)
            self.running = True
            
            _log.info(f'{NS} > Service started successfully')
            
            await self.client.run()
            
        except Exception as e:
            _log.error(f'{NS} ! Service error: {e}')
            raise
    
    async def stop(self) -> None:
        """Stop the service"""
        _log.info(f'{NS} > Stopping service...')
        self.running = False
        
        if self.client:
            await self.client.disconnect()
        
        _log.info(f'{NS} > Service stopped')
    
    def get_stats(self) -> dict:
        """Get service statistics"""
        stats = {
            'running': self.running,
            'config': {
                'threshold': self.config.threshold,
                'ai_enabled': self.config.enable_ai_analysis
            }
        }
        
        if self.client:
            stats['client'] = self.client.get_stats()
        
        return stats


# Global service instance
service: Optional[MotionDetectionService] = None


def signal_handler(sig, frame) -> None:
    """Handle shutdown signals"""
    _log.info(f'{NS} > Received signal {sig}, shutting down...')
    if service:
        asyncio.create_task(service.stop())


async def main() -> None:
    """Main entry point"""
    global service
    
    try:
        _log.info(f'{NS} ========================================')
        _log.info(f'{NS} ESP32 Motion Detection Service v1.0.0')
        _log.info(f'{NS} ========================================')
        
        # Setup signal handlers
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        
        # Start service
        service = MotionDetectionService()
        await service.start()
        
    except KeyboardInterrupt:
        _log.info(f'{NS} > Keyboard interrupt received')
    except Exception as e:
        _log.error(f'{NS} ! Fatal error: {e}')
        sys.exit(1)
    finally:
        if service:
            await service.stop()
        _log.info(f'{NS} > Service terminated')


if __name__ == '__main__':
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        _log.info(f'{NS} > Exiting...')
