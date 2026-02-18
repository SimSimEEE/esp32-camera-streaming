/**
 * `ViewerStatsService.java`
 * - Viewer statistics service module
 * - Handles: Viewer count tracking, uptime monitoring
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */
package io.granule.camera.server.module;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

/**
 * Viewer Statistics Service
 * Tracks server uptime and viewer statistics
 */
public class ViewerStatsService {
    private static final Logger _log = LoggerFactory.getLogger(ViewerStatsService.class);
    
    private final long serverStartTime = System.currentTimeMillis();
    
    /**
     * Get server uptime in seconds
     */
    public final long getUptimeSeconds() {
        return (System.currentTimeMillis() - serverStartTime) / 1000;
    }
    
    /**
     * Get all statistics
     */
    public final Map<String, Object> getStatistics(
            final int viewerCount, 
            final int esp32Count,
            final long totalFrames,
            final long totalBytes,
            final long ledCommands,
            final String ledStatus) {
        
        final Map<String, Object> stats = new HashMap<>();
        stats.put("uptimeSeconds", getUptimeSeconds());
        stats.put("totalFramesReceived", totalFrames);
        stats.put("totalBytesReceived", totalBytes);
        stats.put("totalLedCommands", ledCommands);
        stats.put("esp32Clients", esp32Count);
        stats.put("webClients", viewerCount);
        stats.put("currentLedStatus", ledStatus);
        
        return stats;
    }
    
    /**
     * Log statistics
     */
    public final void logStatistics(final Map<String, Object> stats) {
        _log.info("[Stats] Viewer Statistics:");
        stats.forEach((key, value) -> _log.info("  - {}: {}", key, value));
    }
}
