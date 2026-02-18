/**
 * `CameraStreamServer.java`
 * - WebSocket server for ESP32 camera streaming with LED control
 * - Modular architecture: Connection + LED + Frame + Stats modules
 * - Features: Frame relay, LED synchronization, connection management
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 modularized version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */
package io.granule.camera.server;

import io.granule.camera.server.config.ServerConfig;
import io.granule.camera.server.module.ConnectionManager;
import io.granule.camera.server.module.LedStateManager;
import io.granule.camera.server.module.FrameRelayService;
import io.granule.camera.server.module.ViewerStatsService;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.util.Map;
import java.util.concurrent.Semaphore;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;

/**
 * WebSocket server that relays camera frames from ESP32 to web clients
 * Supports LED control with multi-client synchronization
 */
public class CameraStreamServer extends WebSocketServer {
    private static final Logger _log = LoggerFactory.getLogger(CameraStreamServer.class);
    
    // Module instances
    private final ConnectionManager connectionManager = new ConnectionManager();
    private final LedStateManager ledStateManager = new LedStateManager();
    private final FrameRelayService frameRelayService = new FrameRelayService();
    private final ViewerStatsService viewerStatsService = new ViewerStatsService();
    
    // Version tracking (Thread-Safe)
    private final AtomicReference<String> firmwareVersion = new AtomicReference<>("Unknown");
    
    // Race Condition prevention
    private final Semaphore ledControlSemaphore = new Semaphore(1, true); // Fair LED control
    private final ReentrantLock viewerCountLock = new ReentrantLock(true); // Fair lock
    private volatile long lastViewerCountBroadcast = 0;
    private static final long VIEWER_COUNT_DEBOUNCE_MS = 100; // 100ms debouncing
    
    public CameraStreamServer(final int port) {
        super(new InetSocketAddress(port));
        _log.info("CameraStreamServer initialized on port {} (modular architecture)", port);
    }
    
    @Override
    public void onOpen(final WebSocket conn, final ClientHandshake handshake) {
        final String uri = handshake.getResourceDescriptor();
        final String remoteAddress = conn.getRemoteSocketAddress().toString();
        
        _log.info("New connection from {}: {}", remoteAddress, uri);
        
        // Determine client type based on URI
        if (uri.startsWith("/esp32")) {
            connectionManager.addEsp32Client(conn);
            
            // Request current LED status from ESP32
            conn.send("LED_STATUS");
            _log.debug("Requested LED status from ESP32");
        } else if (uri.startsWith("/viewer")) {
            connectionManager.addWebClient(conn);
            _log.info("New web viewer connected: {}", conn.getRemoteSocketAddress());
            
            // Send current LED state to new viewer
            conn.send(ledStateManager.getStatus());
            _log.debug("Sent current LED state to new viewer: {}", ledStateManager.getStatus());
            
            // Send version information
            sendVersionInfo(conn);
            
            // Broadcast viewer count to all web clients
            broadcastViewerCount();
        } else {
            _log.warn("Unknown client type: {}", uri);
            conn.close();
            return;
        }
    }
    
    @Override
    public void onClose(final WebSocket conn, final int code, final String reason, final boolean remote) {
        final String remoteAddress = conn.getRemoteSocketAddress().toString();
        
        _log.info("Connection closed: {} - {}", remoteAddress, reason);
        
        final boolean wasWebClient = connectionManager.removeClient(conn);
        
        // Notify remaining viewers of updated count
        if (wasWebClient) {
            broadcastViewerCount();
        }
    }
    
    @Override
    public void onMessage(final WebSocket conn, final String message) {
        _log.debug("Text message received from {}: {}", conn.getRemoteSocketAddress(), message);
        
        // Handle control messages
        if (connectionManager.isEsp32Client(conn)) {
            _log.debug("Status message from ESP32: {}", message);
            
            // Handle firmware version information
            if (message.startsWith("FIRMWARE_VERSION:")) {
                firmwareVersion.set(message.substring("FIRMWARE_VERSION:".length()));
                _log.info("ESP32 firmware version: {}", firmwareVersion.get());
                
                // Broadcast version update to all web clients
                broadcastVersionInfo();
                return;
            }
            
            // Update LED state if it's a status message
            if (ledStateManager.isLedStatusUpdate(message)) {
                ledStateManager.updateStatus(message);
            }
            
            // Broadcast to all web clients
            connectionManager.broadcastToWebClients(message);
        } else if (connectionManager.isWebClient(conn)) {
            _log.debug("Control message from web client: {}", message);
            
            // LED control with Race Condition prevention
            if (ledStateManager.isLedCommand(message)) {
                try {
                    // Try to acquire LED control lock (500ms timeout)
                    if (ledControlSemaphore.tryAcquire(500, TimeUnit.MILLISECONDS)) {
                        try {
                            ledStateManager.incrementCommandCount();
                            
                            // Broadcast LED control to ALL web clients for UI sync
                            connectionManager.broadcastToWebClients(message);
                            
                            // Forward control to ESP32
                            connectionManager.broadcastToESP32(message);
                            
                            _log.info("[LED] Control executed: {} by {}", message, conn.getRemoteSocketAddress());
                        } finally {
                            ledControlSemaphore.release();
                        }
                    } else {
                        // LED control is busy
                        conn.send("LED_BUSY:다른 사용자가 제어 중입니다");
                        _log.warn("[LED] Control rejected (busy): {}", conn.getRemoteSocketAddress());
                    }
                } catch (final InterruptedException e) {
                    Thread.currentThread().interrupt();
                    _log.error("[LED] Control interrupted", e);
                }
            } else {
                // Non-LED control messages - forward directly
                connectionManager.broadcastToESP32(message);
            }
        }
    }
    
    @Override
    public void onMessage(final WebSocket conn, final ByteBuffer message) {
        // Receive binary data (camera frames) from ESP32
        if (connectionManager.isEsp32Client(conn)) {
            final int frameSize = message.remaining();
            _log.debug("Received frame from ESP32: {} bytes", frameSize);
            
            // Update statistics
            frameRelayService.recordFrame(frameSize);
            
            // Broadcast to all web clients
            connectionManager.broadcastToWebClients(message);
        }
    }
    
    @Override
    public void onError(final WebSocket conn, final Exception ex) {
        _log.error("WebSocket error", ex);
        if (conn != null) {
            _log.error("Error from: {}", conn.getRemoteSocketAddress());
        }
    }
    
    @Override
    public void onStart() {
        _log.info("WebSocket server started successfully");
    }
    
    /**
     * Broadcast current viewer count to all web clients
     * Debouncing applied to prevent excessive broadcasts
     */
    private void broadcastViewerCount() {
        if (viewerCountLock.tryLock()) {
            try {
                final long now = System.currentTimeMillis();
                if (now - lastViewerCountBroadcast > VIEWER_COUNT_DEBOUNCE_MS) {
                    final int viewerCount = connectionManager.getWebClientsCount();
                    final String message = "VIEWERS_COUNT:" + viewerCount;
                    connectionManager.broadcastToWebClients(message);
                    lastViewerCountBroadcast = now;
                    _log.debug("Broadcasted viewer count: {}", viewerCount);
                }
            } finally {
                viewerCountLock.unlock();
            }
        }
    }
    
    /**
     * Get server statistics
     */
    public final Map<String, Object> getStatistics() {
        return viewerStatsService.getStatistics(
            connectionManager.getWebClientsCount(),
            connectionManager.getEsp32ClientsCount(),
            frameRelayService.getTotalFrames(),
            frameRelayService.getTotalBytes(),
            ledStateManager.getCommandCount(),
            ledStateManager.getStatus()
        );
    }
    
    /**
     * Send version information to a specific web client
     */
    private void sendVersionInfo(final WebSocket conn) {
        try {
            _log.info("sendVersionInfo() called for connection: {}", conn.getRemoteSocketAddress());
            final String versionJson = String.format(
                "{\"server\":\"%s\",\"firmware\":\"%s\"}",
                ServerConfig.APP_VERSION,
                firmwareVersion.get()
            );
            final String message = "VERSION_INFO:" + versionJson;
            _log.info("Sending VERSION_INFO message: {}", message);
            conn.send(message);
            _log.info("Successfully sent version info to client: {}", versionJson);
        } catch (final Exception e) {
            _log.error("Error sending version info", e);
        }
    }
    
    /**
     * Broadcast version information to all web clients
     */
    private void broadcastVersionInfo() {
        final String versionJson = String.format(
            "{\"server\":\"%s\",\"firmware\":\"%s\"}",
            ServerConfig.APP_VERSION,
            firmwareVersion.get()
        );
        final String message = "VERSION_INFO:" + versionJson;
        connectionManager.broadcastToWebClients(message);
        _log.info("Broadcasted version info: {}", versionJson);
    }
    
    /**
     * Main method to start the server
     */
    public static void main(String[] args) {
        // Use ServerConfig for port configuration
        final int port = args.length > 0 ? Integer.parseInt(args[0]) : ServerConfig.getPort();
        
        // Print configuration summary
        ServerConfig.printConfig();
        
        final CameraStreamServer server = new CameraStreamServer(port);
        server.setReuseAddr(ServerConfig.REUSE_ADDRESS);
        server.start();
        
        _log.info("Server started on port: {}", port);
        _log.info("ESP32 endpoint: ws://localhost:{}{}", port, ServerConfig.ENDPOINT_ESP32);
        _log.info("Viewer endpoint: ws://localhost:{}{}", port, ServerConfig.ENDPOINT_VIEWER);
        _log.info("========================================");
        
        // Add shutdown hook to log final statistics
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            _log.info("Shutting down server...");
            
            // Log final statistics via ViewerStatsService
            final Map<String, Object> stats = server.getStatistics();
            server.viewerStatsService.logStatistics(stats);
            
            try {
                server.stop(1000);
            } catch (InterruptedException e) {
                _log.error("Error stopping server: {}", e.getMessage());
            }
        }));
        
        _log.info("Press Ctrl+C to stop the server");
    }
}
