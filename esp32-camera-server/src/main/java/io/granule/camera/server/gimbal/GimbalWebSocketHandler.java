/**
 * `GimbalWebSocketHandler.java`
 * - WebSocket handler for ESP32 Gimbal telemetry and control
 * - Manages binary protocol communication
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-26 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */
package io.granule.camera.server.gimbal;

import org.java_websocket.WebSocket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Manages WebSocket connections for Gimbal system
 * - ESP32 Gimbal: Sends telemetry, receives control commands
 * - Web Dashboard: Receives telemetry, sends control commands
 */
public class GimbalWebSocketHandler {
    private static final Logger _log = LoggerFactory.getLogger(GimbalWebSocketHandler.class);
    
    // Connected clients
    private final Set<WebSocket> esp32Clients = ConcurrentHashMap.newKeySet();
    private final Set<WebSocket> dashboardClients = ConcurrentHashMap.newKeySet();
    
    // Statistics
    private final AtomicLong messagesReceived = new AtomicLong(0);
    private final AtomicLong messagesSent = new AtomicLong(0);
    private final AtomicLong telemetryCount = new AtomicLong(0);
    private final AtomicLong controlCount = new AtomicLong(0);
    
    // Latest telemetry (for new dashboard clients)
    private volatile GimbalProtocol.TelemetryPayload latestTelemetry;
    private volatile long lastTelemetryTime = 0;
    
    /**
     * Add ESP32 gimbal client
     */
    public void addEsp32Client(WebSocket conn) {
        esp32Clients.add(conn);
        _log.info("========================================");
        _log.info("🎮 ESP32 GIMBAL CONNECTED");
        _log.info("Remote: {}", conn.getRemoteSocketAddress());
        _log.info("Total ESP32 clients: {}", esp32Clients.size());
        _log.info("========================================");
        
        // Send heartbeat to confirm connection
        sendHeartbeat(conn);
    }
    
    /**
     * Add web dashboard client
     */
    public void addDashboardClient(WebSocket conn) {
        dashboardClients.add(conn);
        _log.info("========================================");
        _log.info("📊 DASHBOARD CONNECTED");
        _log.info("Remote: {}", conn.getRemoteSocketAddress());
        _log.info("Total dashboard clients: {}", dashboardClients.size());
        _log.info("========================================");
        
        // Send latest telemetry if available
        if (latestTelemetry != null && 
            (System.currentTimeMillis() - lastTelemetryTime) < 5000) {
            sendTelemetryToDashboard(latestTelemetry);
            _log.debug("Sent cached telemetry to new dashboard");
        }
    }
    
    /**
     * Remove client (ESP32 or Dashboard)
     */
    public void removeClient(WebSocket conn) {
        boolean wasEsp32 = esp32Clients.remove(conn);
        boolean wasDashboard = dashboardClients.remove(conn);
        
        if (wasEsp32) {
            _log.warn("ESP32 gimbal disconnected: {}", conn.getRemoteSocketAddress());
            _log.info("Remaining ESP32 clients: {}", esp32Clients.size());
        }
        if (wasDashboard) {
            _log.info("Dashboard disconnected: {}", conn.getRemoteSocketAddress());
            _log.info("Remaining dashboard clients: {}", dashboardClients.size());
        }
    }
    
    /**
     * Handle binary message from client
     */
    public void handleBinaryMessage(WebSocket sender, ByteBuffer buffer) {
        messagesReceived.incrementAndGet();
        
        // Set byte order to little-endian (ESP32 default)
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        
        // Verify minimum size
        if (buffer.remaining() < GimbalProtocol.HEADER_SIZE + GimbalProtocol.CRC_SIZE) {
            _log.warn("Message too short: {} bytes", buffer.remaining());
            return;
        }
        
        // Verify CRC
        if (!GimbalProtocol.verifyCRC(buffer)) {
            _log.error("CRC verification failed");
            return;
        }
        
        // Parse header
        buffer.position(0);
        GimbalProtocol.MessageHeader header = GimbalProtocol.MessageHeader.parse(buffer);
        
        if (!header.isValid()) {
            _log.error("Invalid message header: magic=0x{}, version=0x{}", 
                      Integer.toHexString(header.magic & 0xFFFF),
                      Integer.toHexString(header.version & 0xFF));
            return;
        }
        
        // Route based on message type
        switch (header.type) {
            case GimbalProtocol.MSG_TYPE_TELEMETRY:
                handleTelemetry(sender, buffer);
                break;
                
            case GimbalProtocol.MSG_TYPE_CONTROL:
                handleControl(sender, buffer);
                break;
                
            case GimbalProtocol.MSG_TYPE_PID_UPDATE:
                handlePIDUpdate(sender, buffer);
                break;
                
            case GimbalProtocol.MSG_TYPE_HEARTBEAT:
                handleHeartbeat(sender, buffer);
                break;
                
            default:
                _log.warn("Unknown message type: 0x{}", Integer.toHexString(header.type & 0xFF));
                break;
        }
    }
    
    /**
     * Handle telemetry message from ESP32
     */
    private void handleTelemetry(WebSocket sender, ByteBuffer buffer) {
        try {
            GimbalProtocol.TelemetryPayload payload = GimbalProtocol.TelemetryPayload.parse(buffer);
            
            telemetryCount.incrementAndGet();
            latestTelemetry = payload;
            lastTelemetryTime = System.currentTimeMillis();
            
            // Log telemetry (throttled)
            if (telemetryCount.get() % 10 == 0) {
                _log.debug("Telemetry #{}: pitch={:.2f}°, roll={:.2f}°, heap={}KB, loops={}",
                          telemetryCount.get(),
                          payload.pitch,
                          payload.roll,
                          payload.freeHeap / 1024,
                          payload.loopCount);
            }
            
            // Broadcast to all dashboard clients
            sendTelemetryToDashboard(payload);
            
        } catch (Exception e) {
            _log.error("Failed to parse telemetry", e);
        }
    }
    
    /**
     * Handle control command from dashboard
     */
    private void handleControl(WebSocket sender, ByteBuffer buffer) {
        // Dashboard → Server → ESP32
        // Simply relay to all ESP32 clients
        
        controlCount.incrementAndGet();
        _log.info("Control command received from dashboard, relaying to {} ESP32 clients",
                 esp32Clients.size());
        
        // Relay to all ESP32 clients
        byte[] data = new byte[buffer.remaining()];
        buffer.position(0);
        buffer.get(data);
        
        for (WebSocket esp32 : esp32Clients) {
            if (esp32.isOpen()) {
                esp32.send(data);
                messagesSent.incrementAndGet();
            }
        }
    }
    
    /**
     * Handle PID update from dashboard
     */
    private void handlePIDUpdate(WebSocket sender, ByteBuffer buffer) {
        // Dashboard → Server → ESP32
        // Relay to all ESP32 clients
        
        _log.info("PID update received from dashboard, relaying to {} ESP32 clients",
                 esp32Clients.size());
        
        byte[] data = new byte[buffer.remaining()];
        buffer.position(0);
        buffer.get(data);
        
        for (WebSocket esp32 : esp32Clients) {
            if (esp32.isOpen()) {
                esp32.send(data);
                messagesSent.incrementAndGet();
            }
        }
    }
    
    /**
     * Handle heartbeat message
     */
    private void handleHeartbeat(WebSocket sender, ByteBuffer buffer) {
        _log.debug("Heartbeat received from {}", sender.getRemoteSocketAddress());
        
        // Echo heartbeat back
        byte[] data = new byte[buffer.remaining()];
        buffer.position(0);
        buffer.get(data);
        sender.send(data);
    }
    
    /**
     * Send telemetry to all dashboard clients
     */
    private void sendTelemetryToDashboard(GimbalProtocol.TelemetryPayload payload) {
        // Serialize telemetry back to binary
        ByteBuffer buffer = ByteBuffer.allocate(GimbalProtocol.TELEMETRY_PAYLOAD_SIZE);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        
        buffer.putInt((int) payload.timestamp);
        buffer.putFloat(payload.pitch);
        buffer.putFloat(payload.roll);
        buffer.putFloat(payload.yaw);
        buffer.putFloat(payload.servoPitch);
        buffer.putFloat(payload.servoRoll);
        buffer.putInt((int) payload.freeHeap);
        buffer.put((byte) payload.cpuLoad);
        buffer.put(payload.rssi);
        buffer.put((byte) payload.taskErrors);
        buffer.put((byte) 0); // reserved1
        buffer.putInt((int) payload.loopCount);
        buffer.putInt((int) payload.reserved);
        
        byte[] message = GimbalProtocol.buildMessage(
            GimbalProtocol.MSG_TYPE_TELEMETRY,
            buffer.array()
        );
        
        // Broadcast to all dashboard clients
        int sent = 0;
        for (WebSocket dashboard : dashboardClients) {
            if (dashboard.isOpen()) {
                dashboard.send(message);
                messagesSent.incrementAndGet();
                sent++;
            }
        }
        
        if (sent > 0 && telemetryCount.get() % 50 == 0) {
            _log.debug("Broadcasted telemetry to {} dashboards", sent);
        }
    }
    
    /**
     * Send heartbeat to client
     */
    private void sendHeartbeat(WebSocket conn) {
        GimbalProtocol.HeartbeatPayload payload = new GimbalProtocol.HeartbeatPayload();
        payload.timestamp = System.currentTimeMillis();
        payload.systemStatus = 0; // OK
        
        byte[] message = GimbalProtocol.buildMessage(
            GimbalProtocol.MSG_TYPE_HEARTBEAT,
            payload.serialize()
        );
        
        conn.send(message);
        _log.debug("Sent heartbeat to {}", conn.getRemoteSocketAddress());
    }
    
    /**
     * Send control command to ESP32
     */
    public void sendControlCommand(float targetPitch, float targetRoll) {
        GimbalProtocol.ControlPayload payload = new GimbalProtocol.ControlPayload();
        payload.targetPitch = targetPitch;
        payload.targetRoll = targetRoll;
        
        byte[] message = GimbalProtocol.buildMessage(
            GimbalProtocol.MSG_TYPE_CONTROL,
            payload.serialize()
        );
        
        for (WebSocket esp32 : esp32Clients) {
            if (esp32.isOpen()) {
                esp32.send(message);
                messagesSent.incrementAndGet();
            }
        }
        
        _log.info("Sent control command: pitch={:.2f}°, roll={:.2f}° to {} ESP32 clients",
                 targetPitch, targetRoll, esp32Clients.size());
    }
    
    /**
     * Send PID update to ESP32
     */
    public void sendPIDUpdate(byte axis, float kp, float ki, float kd, 
                             float integralMin, float integralMax) {
        GimbalProtocol.PIDUpdatePayload payload = new GimbalProtocol.PIDUpdatePayload();
        payload.axis = axis;
        payload.kp = kp;
        payload.ki = ki;
        payload.kd = kd;
        payload.integralMin = integralMin;
        payload.integralMax = integralMax;
        
        byte[] message = GimbalProtocol.buildMessage(
            GimbalProtocol.MSG_TYPE_PID_UPDATE,
            payload.serialize()
        );
        
        for (WebSocket esp32 : esp32Clients) {
            if (esp32.isOpen()) {
                esp32.send(message);
                messagesSent.incrementAndGet();
            }
        }
        
        String axisName = (axis == 0) ? "PITCH" : "ROLL";
        _log.info("Sent PID update [{}]: Kp={:.3f}, Ki={:.3f}, Kd={:.3f} to {} ESP32 clients",
                 axisName, kp, ki, kd, esp32Clients.size());
    }
    
    /**
     * Get statistics
     */
    public String getStats() {
        return String.format(
            "Gimbal Stats: ESP32=%d, Dashboards=%d, Msgs(RX=%d,TX=%d), Telemetry=%d, Control=%d",
            esp32Clients.size(),
            dashboardClients.size(),
            messagesReceived.get(),
            messagesSent.get(),
            telemetryCount.get(),
            controlCount.get()
        );
    }
}
