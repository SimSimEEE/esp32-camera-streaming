/**
 * `GimbalWebSocketHandler.java`
 * - WebSocket handler for ESP32 gimbal binary protocol
 * - Manages dual client sets: ESP32 gimbal + Web dashboards
 * - Routes telemetry: ESP32 → Dashboards
 * - Routes control: Dashboard → ESP32
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-21 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */
package io.granule.camera.server.module;

import org.java_websocket.WebSocket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Handler for gimbal WebSocket connections and binary protocol
 * Thread-safe client management with ConcurrentHashMap
 */
public class GimbalWebSocketHandler {
    private static final Logger _log = LoggerFactory.getLogger(GimbalWebSocketHandler.class);
    
    // Client management (thread-safe)
    private final Set<WebSocket> esp32Clients = ConcurrentHashMap.newKeySet();
    private final Set<WebSocket> dashboardClients = ConcurrentHashMap.newKeySet();
    
    // Statistics (thread-safe)
    private final AtomicLong messagesReceived = new AtomicLong(0);
    private final AtomicLong messagesSent = new AtomicLong(0);
    private final AtomicLong telemetryCount = new AtomicLong(0);
    private final AtomicLong controlCount = new AtomicLong(0);
    
    // Telemetry caching (for new dashboards)
    private volatile byte[] latestTelemetry = null;
    private volatile long latestTelemetryTime = 0;
    private static final long TELEMETRY_CACHE_MS = 5000; // 5 seconds
    
    /**
     * Add ESP32 gimbal client
     */
    public final void addEsp32Client(final WebSocket conn) {
        esp32Clients.add(conn);
        _log.info("✅ ESP32 gimbal client added: {} (total: {})",
                conn.getRemoteSocketAddress(), esp32Clients.size());
    }
    
    /**
     * Add dashboard client
     */
    public final void addDashboardClient(final WebSocket conn) {
        dashboardClients.add(conn);
        _log.info("✅ Dashboard client added: {} (total: {})",
                conn.getRemoteSocketAddress(), dashboardClients.size());
    }
    
    /**
     * Remove client from all sets
     */
    public final void removeClient(final WebSocket conn) {
        final boolean wasEsp32 = esp32Clients.remove(conn);
        final boolean wasDashboard = dashboardClients.remove(conn);
        
        if (wasEsp32) {
            _log.info("❌ ESP32 gimbal client removed: {} (total: {})",
                    conn.getRemoteSocketAddress(), esp32Clients.size());
        }
        if (wasDashboard) {
            _log.info("❌ Dashboard client removed: {} (total: {})",
                    conn.getRemoteSocketAddress(), dashboardClients.size());
        }
    }
    
    /**
     * Check if connection is a gimbal client (ESP32 or dashboard)
     */
    public final boolean isGimbalClient(final WebSocket conn) {
        return esp32Clients.contains(conn) || dashboardClients.contains(conn);
    }
    
    /**
     * Get latest cached telemetry (if available)
     */
    public final byte[] getLatestTelemetry() {
        final long now = System.currentTimeMillis();
        if (latestTelemetry != null && (now - latestTelemetryTime) < TELEMETRY_CACHE_MS) {
            return latestTelemetry.clone();
        }
        return null;
    }
    
    /**
     * Handle incoming binary message from gimbal clients
     */
    public final void handleBinaryMessage(final WebSocket conn, final ByteBuffer message) {
        messagesReceived.incrementAndGet();
        
        message.order(ByteOrder.LITTLE_ENDIAN);
        final int messageSize = message.remaining();
        
        try {
            // Parse header
            if (messageSize < GimbalProtocol.HEADER_SIZE + GimbalProtocol.CRC_SIZE) {
                _log.warn("Message too small: {} bytes", messageSize);
                return;
            }
            
            final GimbalProtocol.MessageHeader header = GimbalProtocol.MessageHeader.parse(message);
            
            if (!header.isValid()) {
                _log.warn("Invalid header: {}", header);
                return;
            }
            
            // Verify CRC
            final int expectedSize = GimbalProtocol.HEADER_SIZE + header.payloadLength + GimbalProtocol.CRC_SIZE;
            if (messageSize != expectedSize) {
                _log.warn("Size mismatch: expected {}, got {}", expectedSize, messageSize);
                return;
            }
            
            // Extract CRC from message
            message.position(0);
            final byte[] fullMessage = new byte[messageSize];
            message.get(fullMessage);
            
            final int receivedCrc = ((fullMessage[messageSize - 1] & 0xFF) << 8) |
                    (fullMessage[messageSize - 2] & 0xFF);
            
            if (!GimbalProtocol.verifyCRC(fullMessage, messageSize - GimbalProtocol.CRC_SIZE, receivedCrc)) {
                _log.warn("CRC verification failed");
                return;
            }
            
            // Route by message type
            message.position(GimbalProtocol.HEADER_SIZE);
            
            switch (header.messageType) {
                case GimbalProtocol.MSG_TYPE_TELEMETRY:
                    handleTelemetry(conn, message, fullMessage);
                    break;
                    
                case GimbalProtocol.MSG_TYPE_CONTROL:
                    handleControl(conn, message);
                    break;
                    
                case GimbalProtocol.MSG_TYPE_PID_UPDATE:
                    handlePIDUpdate(conn, message);
                    break;
                    
                case GimbalProtocol.MSG_TYPE_HEARTBEAT:
                    handleHeartbeat(conn, message, fullMessage);
                    break;
                    
                default:
                    _log.warn("Unknown message type: 0x{}", Integer.toHexString(header.messageType));
            }
            
        } catch (final Exception e) {
            _log.error("Error handling binary message", e);
        }
    }
    
    /**
     * Handle telemetry message from ESP32
     * Broadcasts to all dashboards
     */
    private void handleTelemetry(final WebSocket conn, final ByteBuffer buffer, final byte[] fullMessage) {
        if (!esp32Clients.contains(conn)) {
            _log.warn("Telemetry from non-ESP32 client: {}", conn.getRemoteSocketAddress());
            return;
        }
        
        try {
            final GimbalProtocol.TelemetryPayload telemetry = GimbalProtocol.TelemetryPayload.parse(buffer);
            telemetryCount.incrementAndGet();
            
            // Cache telemetry
            latestTelemetry = fullMessage.clone();
            latestTelemetryTime = System.currentTimeMillis();
            
            // Throttled logging (every 100 messages)
            if (telemetryCount.get() % 100 == 0) {
                _log.info("📊 Telemetry #{}: {}", telemetryCount.get(), telemetry);
            }
            
            // Broadcast to all dashboards
            final ByteBuffer broadcast = ByteBuffer.wrap(fullMessage);
            for (final WebSocket dashboard : dashboardClients) {
                try {
                    dashboard.send(broadcast.duplicate());
                    messagesSent.incrementAndGet();
                } catch (final Exception e) {
                    _log.error("Error broadcasting to dashboard: {}", dashboard.getRemoteSocketAddress(), e);
                }
            }
            
            if (telemetryCount.get() % 100 == 0) {
                _log.debug("Broadcasted to {} dashboards", dashboardClients.size());
            }
            
        } catch (final Exception e) {
            _log.error("Error parsing telemetry", e);
        }
    }
    
    /**
     * Handle control message from dashboard
     * Relays to ESP32 gimbal
     */
    private void handleControl(final WebSocket conn, final ByteBuffer buffer) {
        if (!dashboardClients.contains(conn)) {
            _log.warn("Control from non-dashboard client: {}", conn.getRemoteSocketAddress());
            return;
        }
        
        controlCount.incrementAndGet();
        
        _log.info("🎮 Control command from dashboard: {}", conn.getRemoteSocketAddress());
        
        // Relay to all ESP32 clients
        buffer.position(0);
        final byte[] controlData = new byte[buffer.remaining()];
        buffer.get(controlData);
        
        for (final WebSocket esp32 : esp32Clients) {
            try {
                esp32.send(controlData);
                messagesSent.incrementAndGet();
                _log.debug("Relayed control to ESP32: {}", esp32.getRemoteSocketAddress());
            } catch (final Exception e) {
                _log.error("Error relaying control to ESP32: {}", esp32.getRemoteSocketAddress(), e);
            }
        }
    }
    
    /**
     * Handle PID update message from dashboard
     * Relays to ESP32 gimbal
     */
    private void handlePIDUpdate(final WebSocket conn, final ByteBuffer buffer) {
        if (!dashboardClients.contains(conn)) {
            _log.warn("PID update from non-dashboard client: {}", conn.getRemoteSocketAddress());
            return;
        }
        
        _log.info("⚙️ PID update from dashboard: {}", conn.getRemoteSocketAddress());
        
        // Relay to all ESP32 clients
        buffer.position(0);
        final byte[] pidData = new byte[buffer.remaining()];
        buffer.get(pidData);
        
        for (final WebSocket esp32 : esp32Clients) {
            try {
                esp32.send(pidData);
                messagesSent.incrementAndGet();
                _log.debug("Relayed PID update to ESP32: {}", esp32.getRemoteSocketAddress());
            } catch (final Exception e) {
                _log.error("Error relaying PID update to ESP32: {}", esp32.getRemoteSocketAddress(), e);
            }
        }
    }
    
    /**
     * Handle heartbeat message
     * Echoes back to sender
     */
    private void handleHeartbeat(final WebSocket conn, final ByteBuffer buffer, final byte[] fullMessage) {
        try {
            final GimbalProtocol.HeartbeatPayload heartbeat = GimbalProtocol.HeartbeatPayload.parse(buffer);
            
            _log.debug("💓 Heartbeat from {}: {}", conn.getRemoteSocketAddress(), heartbeat);
            
            // Echo back
            conn.send(fullMessage);
            messagesSent.incrementAndGet();
            
        } catch (final Exception e) {
            _log.error("Error handling heartbeat", e);
        }
    }
    
    /**
     * Send control command to ESP32 (API for external use)
     */
    public final void sendControlCommand(final float targetPitch, final float targetRoll) {
        if (esp32Clients.isEmpty()) {
            _log.warn("No ESP32 clients connected, cannot send control command");
            return;
        }
        
        final GimbalProtocol.ControlPayload control = new GimbalProtocol.ControlPayload(targetPitch, targetRoll);
        final ByteBuffer payload = control.serialize();
        final byte[] message = GimbalProtocol.buildMessage(GimbalProtocol.MSG_TYPE_CONTROL, payload);
        
        for (final WebSocket esp32 : esp32Clients) {
            try {
                esp32.send(message);
                messagesSent.incrementAndGet();
                _log.info("Sent control command: {}", control);
            } catch (final Exception e) {
                _log.error("Error sending control command", e);
            }
        }
    }
    
    /**
     * Send PID update to ESP32 (API for external use)
     */
    public final void sendPIDUpdate(final byte axis, final float kp, final float ki, final float kd,
            final float minLimit, final float maxLimit) {
        if (esp32Clients.isEmpty()) {
            _log.warn("No ESP32 clients connected, cannot send PID update");
            return;
        }
        
        final GimbalProtocol.PIDUpdatePayload pidUpdate = new GimbalProtocol.PIDUpdatePayload(
                axis, kp, ki, kd, minLimit, maxLimit);
        final ByteBuffer payload = pidUpdate.serialize();
        final byte[] message = GimbalProtocol.buildMessage(GimbalProtocol.MSG_TYPE_PID_UPDATE, payload);
        
        for (final WebSocket esp32 : esp32Clients) {
            try {
                esp32.send(message);
                messagesSent.incrementAndGet();
                _log.info("Sent PID update: {}", pidUpdate);
            } catch (final Exception e) {
                _log.error("Error sending PID update", e);
            }
        }
    }
    
    /**
     * Get handler statistics
     */
    public final String getStatistics() {
        return String.format("Gimbal{esp32=%d, dashboards=%d, msgs_rx=%d, msgs_tx=%d, telem=%d, ctrl=%d}",
                esp32Clients.size(),
                dashboardClients.size(),
                messagesReceived.get(),
                messagesSent.get(),
                telemetryCount.get(),
                controlCount.get());
    }
    
    /**
     * Get ESP32 client count
     */
    public final int getEsp32Count() {
        return esp32Clients.size();
    }
    
    /**
     * Get dashboard client count
     */
    public final int getDashboardCount() {
        return dashboardClients.size();
    }
}
