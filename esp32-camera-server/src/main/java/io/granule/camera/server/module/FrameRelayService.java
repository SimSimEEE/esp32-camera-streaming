/**
 * `FrameRelayService.java`
 * - Frame relay service module
 * - Handles: Frame counting, data tracking, relay statistics
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */
package io.granule.camera.server.module;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Frame Relay Service
 * Tracks frame relay statistics
 */
public class FrameRelayService {
    private static final Logger _log = LoggerFactory.getLogger(FrameRelayService.class);
    
    private final AtomicLong totalFramesReceived = new AtomicLong(0);
    private final AtomicLong totalBytesReceived = new AtomicLong(0);
    
    /**
     * Record received frame
     */
    public final void recordFrame(final int frameSize) {
        totalFramesReceived.incrementAndGet();
        totalBytesReceived.addAndGet(frameSize);
        
        final long frameCount = totalFramesReceived.get();
        if (frameCount % 100 == 0) {
            _log.info("[Frame] Total frames: {}, Total data: {} MB", 
                     frameCount, totalBytesReceived.get() / 1024 / 1024);
        }
    }
    
    /**
     * Get total frames received
     */
    public final long getTotalFrames() {
        return totalFramesReceived.get();
    }
    
    /**
     * Get total bytes received
     */
    public final long getTotalBytes() {
        return totalBytesReceived.get();
    }
}
