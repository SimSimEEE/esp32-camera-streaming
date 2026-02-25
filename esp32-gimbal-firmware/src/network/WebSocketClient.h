/**
 * `WebSocketClient.h`
 * - WebSocket client for ESP32 Gimbal telemetry and control
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-25 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

#ifndef WEBSOCKET_CLIENT_H
#define WEBSOCKET_CLIENT_H

#include "../include/Protocol.h"
#include <WebSocketsClient.h>
#include <functional>

/**
 * WebSocketClient
 * - Manages WebSocket connection to server
 * - Sends telemetry at 10Hz
 * - Receives control commands and PID updates
 */
class GimbalWebSocketClient {
public:
    // Callback function types
    typedef std::function<void(const ControlPayload&)> ControlCallback;
    typedef std::function<void(const PIDUpdatePayload&)> PIDUpdateCallback;
    
    /**
     * Constructor
     */
    GimbalWebSocketClient();
    
    /**
     * Initialize WebSocket client
     * @param host Server hostname or IP
     * @param port Server port
     * @param endpoint WebSocket endpoint path
     */
    void begin(const char* host, uint16_t port, const char* endpoint);
    
    /**
     * Connect to WebSocket server
     * @return true if connection successful
     */
    bool connect();
    
    /**
     * Disconnect from server
     */
    void disconnect();
    
    /**
     * Check if connected to server
     * @return true if connected
     */
    bool isConnected() const;
    
    /**
     * Process WebSocket events (call in loop)
     */
    void loop();
    
    /**
     * Send telemetry data to server
     * @param payload Telemetry data
     * @return true if sent successfully
     */
    bool sendTelemetry(const TelemetryPayload& payload);
    
    /**
     * Send heartbeat to server
     * @return true if sent successfully
     */
    bool sendHeartbeat();
    
    /**
     * Register callback for control commands
     * @param callback Function to call when control command received
     */
    void onControlCommand(ControlCallback callback);
    
    /**
     * Register callback for PID updates
     * @param callback Function to call when PID update received
     */
    void onPIDUpdate(PIDUpdateCallback callback);
    
    /**
     * Get connection statistics
     */
    uint32_t getMessagesSent() const { return _messagesSent; }
    uint32_t getMessagesReceived() const { return _messagesReceived; }
    uint32_t getReconnectCount() const { return _reconnectCount; }

private:
    WebSocketsClient _ws;
    
    // Connection state
    bool _connected;
    uint32_t _lastHeartbeat;
    uint32_t _reconnectCount;
    
    // Statistics
    uint32_t _messagesSent;
    uint32_t _messagesReceived;
    
    // Callbacks
    ControlCallback _controlCallback;
    PIDUpdateCallback _pidUpdateCallback;
    
    // WebSocket event handler
    void onWebSocketEvent(WStype_t type, uint8_t* payload, size_t length);
    
    // Message handlers
    void handleBinaryMessage(uint8_t* payload, size_t length);
    void handleControlMessage(const uint8_t* data, size_t length);
    void handlePIDUpdateMessage(const uint8_t* data, size_t length);
    
    // Static wrapper for WebSocket callback
    static void webSocketEventWrapper(WStype_t type, uint8_t* payload, size_t length);
    static GimbalWebSocketClient* _instance;
};

#endif // WEBSOCKET_CLIENT_H
