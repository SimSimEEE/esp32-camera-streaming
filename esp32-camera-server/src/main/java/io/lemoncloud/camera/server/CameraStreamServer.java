/**
 * `CameraStreamServer.java`
 * - WebSocket server for ESP32 camera streaming
 *
 * @author      Sim Si-Geun <sim@lemoncloud.io>
 * @date        2026-02-17 initial version
 *
 * @copyright   (C) 2026 LemonCloud Co Ltd. - All Rights Reserved.
 */
package io.lemoncloud.camera.server;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.WebSocketServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.InetSocketAddress;
import java.nio.ByteBuffer;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * WebSocket server that relays camera frames from ESP32 to web clients
 */
public class CameraStreamServer extends WebSocketServer {
    private static final Logger _log = LoggerFactory.getLogger(CameraStreamServer.class);
    
    private final Set<WebSocket> webClients = new CopyOnWriteArraySet<>();
    private final Set<WebSocket> esp32Clients = new CopyOnWriteArraySet<>();
    
    public CameraStreamServer(final int port) {
        super(new InetSocketAddress(port));
        _log.info("CameraStreamServer initialized on port {}", port);
    }
    
    @Override
    public void onOpen(final WebSocket conn, final ClientHandshake handshake) {
        final String uri = handshake.getResourceDescriptor();
        _log.info("New connection from {}: {}", conn.getRemoteSocketAddress(), uri);
        
        // Determine client type based on URI
        if (uri.startsWith("/esp32")) {
            esp32Clients.add(conn);
            _log.info("ESP32 client connected. Total ESP32 clients: {}", esp32Clients.size());
        } else if (uri.startsWith("/viewer")) {
            webClients.add(conn);
            _log.info("Web viewer connected. Total web clients: {}", webClients.size());
        } else {
            _log.warn("Unknown client type: {}", uri);
            conn.close();
        }
    }
    
    @Override
    public void onClose(final WebSocket conn, final int code, final String reason, final boolean remote) {
        _log.info("Connection closed: {} - {}", conn.getRemoteSocketAddress(), reason);
        
        esp32Clients.remove(conn);
        webClients.remove(conn);
        
        _log.info("Remaining clients - ESP32: {}, Web: {}", esp32Clients.size(), webClients.size());
    }
    
    @Override
    public void onMessage(final WebSocket conn, final String message) {
        _log.debug("Text message received from {}: {}", conn.getRemoteSocketAddress(), message);
        
        // Handle control messages
        if (esp32Clients.contains(conn)) {
            _log.debug("Control message from ESP32: {}", message);
        } else if (webClients.contains(conn)) {
            _log.debug("Control message from web client: {}", message);
            // Forward control messages to ESP32
            broadcastToESP32(message);
        }
    }
    
    @Override
    public void onMessage(final WebSocket conn, final ByteBuffer message) {
        // Receive binary data (camera frames) from ESP32
        if (esp32Clients.contains(conn)) {
            final int frameSize = message.remaining();
            _log.debug("Received frame from ESP32: {} bytes", frameSize);
            
            // Broadcast to all web clients
            broadcastToWebClients(message);
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
     * Broadcast message to all web clients
     */
    private final void broadcastToWebClients(final ByteBuffer data) {
        final byte[] frameData = new byte[data.remaining()];
        data.get(frameData);
        data.rewind();
        
        for (final WebSocket client : webClients) {
            try {
                client.send(frameData);
            } catch (Exception e) {
                _log.error("Failed to send frame to web client: {}", e.getMessage());
            }
        }
        
        _log.debug("Broadcasted frame to {} web clients", webClients.size());
    }
    
    /**
     * Broadcast message to all ESP32 clients
     */
    private final void broadcastToESP32(final String message) {
        for (final WebSocket client : esp32Clients) {
            try {
                client.send(message);
            } catch (Exception e) {
                _log.error("Failed to send message to ESP32: {}", e.getMessage());
            }
        }
    }
    
    /**
     * Main method to start the server
     */
    public static void main(String[] args) {
        final int port = args.length > 0 ? Integer.parseInt(args[0]) : 8887;
        
        final CameraStreamServer server = new CameraStreamServer(port);
        server.setReuseAddr(true);
        server.start();
        
        _log.info("========================================");
        _log.info("ESP32 Camera Stream Server");
        _log.info("========================================");
        _log.info("Server started on port: {}", port);
        _log.info("ESP32 endpoint: ws://localhost:{}/esp32", port);
        _log.info("Viewer endpoint: ws://localhost:{}/viewer", port);
        _log.info("========================================");
        _log.info("Press Ctrl+C to stop the server");
    }
}
