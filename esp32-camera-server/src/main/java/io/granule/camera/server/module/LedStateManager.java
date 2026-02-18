/**
 * `LedStateManager.java`
 * - LED state management module
 * - Handles: LED status tracking, state updates, command counting
 *
 * @author      Sim Si-Geun <sim@granule.io>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */
package io.granule.camera.server.module;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.concurrent.atomic.AtomicLong;

/**
 * LED State Manager
 * Manages LED status and command statistics
 */
public class LedStateManager {
    private static final Logger _log = LoggerFactory.getLogger(LedStateManager.class);
    
    private volatile String currentLedStatus = "LED_STATUS:OFF";
    private final Object ledStateLock = new Object();
    private final AtomicLong totalLedCommands = new AtomicLong(0);
    
    /**
     * Update LED status
     */
    public final void updateStatus(final String status) {
        synchronized (ledStateLock) {
            currentLedStatus = status;
            _log.info("[LED] State updated: {}", currentLedStatus);
        }
    }
    
    /**
     * Get current LED status
     */
    public final String getStatus() {
        synchronized (ledStateLock) {
            return currentLedStatus;
        }
    }
    
    /**
     * Increment LED command counter
     */
    public final void incrementCommandCount() {
        totalLedCommands.incrementAndGet();
        _log.debug("[LED] Command count: {}", totalLedCommands.get());
    }
    
    /**
     * Get total LED commands count
     */
    public final long getCommandCount() {
        return totalLedCommands.get();
    }
    
    /**
     * Check if message is LED command
     */
    public final boolean isLedCommand(final String message) {
        return message.startsWith("LED_");
    }
    
    /**
     * Check if message is LED status update
     */
    public final boolean isLedStatusUpdate(final String message) {
        return message.startsWith("LED_STATUS:");
    }
}
