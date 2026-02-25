/**
 * `WebSocketClient.cpp`
 * - WebSocket client implementation
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-25 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

#include "WebSocketClient.h"
#include "../protocol/BinaryProtocol.h"
#include "../include/Config.h"
#include <Arduino.h>

// Static instance pointer for callback wrapper
GimbalWebSocketClient* GimbalWebSocketClient::_instance = nullptr;

// ============================================================================
// Constructor
// ============================================================================
GimbalWebSocketClient::GimbalWebSocketClient()
    : _connected(false)
    , _lastHeartbeat(0)
    , _reconnectCount(0)
    , _messagesSent(0)
    , _messagesReceived(0)
    , _controlCallback(nullptr)
    , _pidUpdateCallback(nullptr)
{
    _instance = this;
}

// ============================================================================
// Initialize WebSocket Client
// ============================================================================
void GimbalWebSocketClient::begin(const char* host, uint16_t port, const char* endpoint) {
    Serial.printf("[WS] Initializing WebSocket: ws://%s:%d%s\n", host, port, endpoint);
    
    // Configure WebSocket
    _ws.begin(host, port, endpoint);
    
    // Set event handler
    _ws.onEvent([this](WStype_t type, uint8_t* payload, size_t length) {
        this->onWebSocketEvent(type, payload, length);
    });
    
    // Enable auto-reconnect
    _ws.setReconnectInterval(WS_RECONNECT_INTERVAL);
    
    Serial.println("[WS] WebSocket initialized");
}

// ============================================================================
// Connect to Server
// ============================================================================
bool GimbalWebSocketClient::connect() {
    Serial.println("[WS] Connecting to WebSocket server...");
    _ws.loop();
    return _connected;
}

// ============================================================================
// Disconnect from Server
// ============================================================================
void GimbalWebSocketClient::disconnect() {
    Serial.println("[WS] Disconnecting from server");
    _ws.disconnect();
    _connected = false;
}

// ============================================================================
// Check Connection Status
// ============================================================================
bool GimbalWebSocketClient::isConnected() const {
    return _connected;
}

// ============================================================================
// Process WebSocket Events
// ============================================================================
void GimbalWebSocketClient::loop() {
    _ws.loop();
    
    // Send periodic heartbeat
    uint32_t now = millis();
    if (_connected && (now - _lastHeartbeat >= HEARTBEAT_INTERVAL)) {
        sendHeartbeat();
        _lastHeartbeat = now;
    }
}

// ============================================================================
// Send Telemetry Data
// ============================================================================
bool GimbalWebSocketClient::sendTelemetry(const TelemetryPayload& payload) {
    if (!_connected) {
        return false;
    }
    
    // Serialize to binary
    uint8_t buffer[TELEMETRY_MSG_SIZE];
    size_t size = BinaryProtocol::serializeTelemetry(payload, buffer);
    
    // Send binary message
    bool success = _ws.sendBIN(buffer, size);
    
    if (success) {
        _messagesSent++;
        
        #if DEBUG_WEBSOCKET
        Serial.printf("[WS] Sent telemetry: pitch=%.2f, roll=%.2f, heap=%u\n",
                     payload.pitch, payload.roll, payload.freeHeap);
        #endif
    } else {
        Serial.println("[WS] Failed to send telemetry");
    }
    
    return success;
}

// ============================================================================
// Send Heartbeat
// ============================================================================
bool GimbalWebSocketClient::sendHeartbeat() {
    if (!_connected) {
        return false;
    }
    
    HeartbeatPayload payload;
    payload.timestamp = millis();
    payload.systemStatus = 0;  // 0 = OK
    payload.reserved[0] = 0;
    payload.reserved[1] = 0;
    payload.reserved[2] = 0;
    
    // Serialize to binary
    uint8_t buffer[HEARTBEAT_MSG_SIZE];
    size_t size = BinaryProtocol::serializeHeartbeat(payload, buffer);
    
    // Send binary message
    bool success = _ws.sendBIN(buffer, size);
    
    if (success) {
        _messagesSent++;
        
        #if DEBUG_WEBSOCKET
        Serial.printf("[WS] Sent heartbeat: ts=%u\n", payload.timestamp);
        #endif
    }
    
    return success;
}

// ============================================================================
// Register Control Command Callback
// ============================================================================
void GimbalWebSocketClient::onControlCommand(ControlCallback callback) {
    _controlCallback = callback;
}

// ============================================================================
// Register PID Update Callback
// ============================================================================
void GimbalWebSocketClient::onPIDUpdate(PIDUpdateCallback callback) {
    _pidUpdateCallback = callback;
}

// ============================================================================
// WebSocket Event Handler
// ============================================================================
void GimbalWebSocketClient::onWebSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.println("[WS] Disconnected from server");
            _connected = false;
            break;
            
        case WStype_CONNECTED:
            Serial.printf("[WS] Connected to server: %s\n", payload);
            _connected = true;
            _reconnectCount++;
            _lastHeartbeat = millis();
            
            // Send initial heartbeat
            sendHeartbeat();
            break;
            
        case WStype_BIN:
            #if DEBUG_WEBSOCKET
            Serial.printf("[WS] Received binary message: %d bytes\n", length);
            #endif
            handleBinaryMessage(payload, length);
            break;
            
        case WStype_TEXT:
            Serial.printf("[WS] Received unexpected text: %s\n", payload);
            break;
            
        case WStype_ERROR:
            Serial.println("[WS] Error occurred");
            break;
            
        case WStype_PING:
            Serial.println("[WS] Received ping");
            break;
            
        case WStype_PONG:
            Serial.println("[WS] Received pong");
            break;
            
        default:
            break;
    }
}

// ============================================================================
// Handle Binary Message
// ============================================================================
void GimbalWebSocketClient::handleBinaryMessage(uint8_t* payload, size_t length) {
    _messagesReceived++;
    
    // Check minimum size for header
    if (length < sizeof(MessageHeader)) {
        Serial.println("[WS] Message too short");
        return;
    }
    
    // Parse header
    const MessageHeader* header = reinterpret_cast<const MessageHeader*>(payload);
    
    // Validate header
    if (!BinaryProtocol::validateHeader(*header)) {
        Serial.println("[WS] Invalid message header");
        return;
    }
    
    // Route based on message type
    switch (header->type) {
        case MSG_TYPE_CONTROL:
            handleControlMessage(payload, length);
            break;
            
        case MSG_TYPE_PID_UPDATE:
            handlePIDUpdateMessage(payload, length);
            break;
            
        case MSG_TYPE_HEARTBEAT:
            #if DEBUG_WEBSOCKET
            Serial.println("[WS] Received heartbeat from server");
            #endif
            break;
            
        default:
            Serial.printf("[WS] Unknown message type: 0x%02X\n", header->type);
            break;
    }
}

// ============================================================================
// Handle Control Command Message
// ============================================================================
void GimbalWebSocketClient::handleControlMessage(const uint8_t* data, size_t length) {
    ControlPayload payload;
    
    if (BinaryProtocol::deserializeControl(data, length, payload)) {
        Serial.printf("[WS] Control command: pitch=%.2f, roll=%.2f\n",
                     payload.targetPitch, payload.targetRoll);
        
        if (_controlCallback) {
            _controlCallback(payload);
        }
    } else {
        Serial.println("[WS] Failed to deserialize control command");
    }
}

// ============================================================================
// Handle PID Update Message
// ============================================================================
void GimbalWebSocketClient::handlePIDUpdateMessage(const uint8_t* data, size_t length) {
    PIDUpdatePayload payload;
    
    if (BinaryProtocol::deserializePIDUpdate(data, length, payload)) {
        const char* axisName = (payload.axis == 0) ? "PITCH" : "ROLL";
        Serial.printf("[WS] PID update [%s]: Kp=%.3f, Ki=%.3f, Kd=%.3f\n",
                     axisName, payload.kp, payload.ki, payload.kd);
        
        if (_pidUpdateCallback) {
            _pidUpdateCallback(payload);
        }
    } else {
        Serial.println("[WS] Failed to deserialize PID update");
    }
}
