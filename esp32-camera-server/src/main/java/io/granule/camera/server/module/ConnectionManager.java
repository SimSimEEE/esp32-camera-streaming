/**
 * `ConnectionManager.java`
 * - WebSocket connection management module
 * - Handles: Client classification, connection tracking, broadcasting
 *
 * @author      Sim Si-Geun <sim@granule.io>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */
package io.granule.camera.server.module;

import org.java_websocket.WebSocket;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.ByteBuffer;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Connection Manager
 * Manages WebSocket connections and client classification
 */
public class ConnectionManager {
    private static final Logger _log = LoggerFactory.getLogger(ConnectionManager.class);
    
    private final Set<WebSocket> webClients = new CopyOnWriteArraySet<>();
    private final Set<WebSocket> esp32Clients = new CopyOnWriteArraySet<>();
    
    /**
     * Add ESP32 client connection
     */
    public final void addEsp32Client(final WebSocket conn) {
        esp32Clients.add(conn);
        _log.info("[Connection] ESP32 client added. Total: {}", esp32Clients.size());
    }
    
    /**
     * Add web viewer client connection
     */
    public final void addWebClient(final WebSocket conn) {
        webClients.add(conn);
        _log.info("[Connection] Web client added. Total: {}", webClients.size());
    }
    
    /**
     * Remove client connection
     */
    public final boolean removeClient(final WebSocket conn) {
        final boolean wasWebClient = webClients.remove(conn);
        esp32Clients.remove(conn);
        _log.info("[Connection] Client removed. Remaining - ESP32: {}, Web: {}", 
                  esp32Clients.size(), webClients.size());
        return wasWebClient;
    }
    
    /**
     * Check if connection is ESP32 client
     */
    public final boolean isEsp32Client(final WebSocket conn) {
        return esp32Clients.contains(conn);
    }
    
    /**
     * Check if connection is web client
     */
    public final boolean isWebClient(final WebSocket conn) {
        return webClients.contains(conn);
    }
    
    /**
     * Get web clients count
     */
    public final int getWebClientsCount() {
        return webClients.size();
    }
    
    /**
     * Get ESP32 clients count
     */
    public final int getEsp32ClientsCount() {
        return esp32Clients.size();
    }
    
    /**
     * Broadcast binary data to all web clients
     */
    public final void broadcastToWebClients(final ByteBuffer data) {
        final byte[] frameData = new byte[data.remaining()];
        data.get(frameData);
        data.rewind();
        
        for (final WebSocket client : webClients) {
            try {
                client.send(frameData);
            } catch (Exception e) {
                _log.error("[Connection] Failed to send frame to web client: {}", e.getMessage());
            }
        }
        
        _log.debug("[Connection] Broadcasted frame to {} web clients", webClients.size());
    }
    
    /**
     * Broadcast text message to all web clients
     */
    public final void broadcastToWebClients(final String message) {
        for (final WebSocket client : webClients) {
            try {
                client.send(message);
            } catch (Exception e) {
                _log.error("[Connection] Failed to send message to web client: {}", e.getMessage());
            }
        }
        _log.debug("[Connection] Broadcasted message to {} web clients: {}", webClients.size(), message);
    }
    
    /**
     * Broadcast message to all ESP32 clients
     */
    public final void broadcastToESP32(final String message) {
        for (final WebSocket client : esp32Clients) {
            try {
                client.send(message);
            } catch (Exception e) {
                _log.error("[Connection] Failed to send message to ESP32: {}", e.getMessage());
            }
        }
        _log.debug("[Connection] Broadcasted message to {} ESP32 clients: {}", esp32Clients.size(), message);
    }
}
