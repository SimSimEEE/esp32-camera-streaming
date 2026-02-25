/**
 * `BinaryProtocol.cpp`
 * - Binary message serialization/deserialization implementation
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-25 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

#include "BinaryProtocol.h"
#include <Arduino.h>
#include <string.h>

// ============================================================================
// CRC16 Calculation (MODBUS/ARC variant)
// ============================================================================
uint16_t BinaryProtocol::calculateCRC16(const uint8_t* data, size_t length) {
    uint16_t crc = 0x0000;
    
    for (size_t i = 0; i < length; i++) {
        crc ^= static_cast<uint16_t>(data[i]);
        
        for (int j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ 0xA001;  // MODBUS polynomial
            } else {
                crc >>= 1;
            }
        }
    }
    
    return crc;
}

// ============================================================================
// Internal Helper - Build Message Header
// ============================================================================
void BinaryProtocol::buildHeader(MessageHeader& header, uint8_t type, uint16_t payloadSize) {
    header.magic = PROTOCOL_MAGIC;
    header.version = PROTOCOL_VERSION;
    header.type = type;
    header.payloadSize = payloadSize;
}

// ============================================================================
// Serialize Telemetry
// ============================================================================
size_t BinaryProtocol::serializeTelemetry(const TelemetryPayload& payload, uint8_t* buffer) {
    TelemetryMessage msg;
    
    // Build header
    buildHeader(msg.header, MSG_TYPE_TELEMETRY, TELEMETRY_PAYLOAD_SIZE);
    
    // Copy payload
    memcpy(&msg.payload, &payload, sizeof(TelemetryPayload));
    
    // Calculate CRC (header + payload)
    msg.crc16 = calculateCRC16(reinterpret_cast<const uint8_t*>(&msg), 
                               sizeof(MessageHeader) + sizeof(TelemetryPayload));
    
    // Copy complete message to buffer
    memcpy(buffer, &msg, sizeof(TelemetryMessage));
    
    return sizeof(TelemetryMessage);
}

// ============================================================================
// Serialize Heartbeat
// ============================================================================
size_t BinaryProtocol::serializeHeartbeat(const HeartbeatPayload& payload, uint8_t* buffer) {
    HeartbeatMessage msg;
    
    // Build header
    buildHeader(msg.header, MSG_TYPE_HEARTBEAT, HEARTBEAT_PAYLOAD_SIZE);
    
    // Copy payload
    memcpy(&msg.payload, &payload, sizeof(HeartbeatPayload));
    
    // Calculate CRC
    msg.crc16 = calculateCRC16(reinterpret_cast<const uint8_t*>(&msg), 
                               sizeof(MessageHeader) + sizeof(HeartbeatPayload));
    
    // Copy complete message to buffer
    memcpy(buffer, &msg, sizeof(HeartbeatMessage));
    
    return sizeof(HeartbeatMessage);
}

// ============================================================================
// Deserialize Control Command
// ============================================================================
bool BinaryProtocol::deserializeControl(const uint8_t* buffer, size_t length, ControlPayload& payload) {
    // Verify length
    if (length != CONTROL_MSG_SIZE) {
        Serial.printf("[PROTO] Control message size mismatch: %d != %d\n", 
                     length, CONTROL_MSG_SIZE);
        return false;
    }
    
    // Cast to message structure
    const ControlMessage* msg = reinterpret_cast<const ControlMessage*>(buffer);
    
    // Validate header
    if (!validateHeader(msg->header)) {
        Serial.println("[PROTO] Invalid control message header");
        return false;
    }
    
    // Verify CRC
    if (!verifyCRC(buffer, length)) {
        Serial.println("[PROTO] Control message CRC check failed");
        return false;
    }
    
    // Copy payload
    memcpy(&payload, &msg->payload, sizeof(ControlPayload));
    
    return true;
}

// ============================================================================
// Deserialize PID Update
// ============================================================================
bool BinaryProtocol::deserializePIDUpdate(const uint8_t* buffer, size_t length, PIDUpdatePayload& payload) {
    // Verify length
    if (length != PID_UPDATE_MSG_SIZE) {
        Serial.printf("[PROTO] PID update size mismatch: %d != %d\n", 
                     length, PID_UPDATE_MSG_SIZE);
        return false;
    }
    
    // Cast to message structure
    const PIDUpdateMessage* msg = reinterpret_cast<const PIDUpdateMessage*>(buffer);
    
    // Validate header
    if (!validateHeader(msg->header)) {
        Serial.println("[PROTO] Invalid PID update header");
        return false;
    }
    
    // Verify CRC
    if (!verifyCRC(buffer, length)) {
        Serial.println("[PROTO] PID update CRC check failed");
        return false;
    }
    
    // Copy payload
    memcpy(&payload, &msg->payload, sizeof(PIDUpdatePayload));
    
    return true;
}

// ============================================================================
// Validate Message Header
// ============================================================================
bool BinaryProtocol::validateHeader(const MessageHeader& header) {
    return (header.magic == PROTOCOL_MAGIC && header.version == PROTOCOL_VERSION);
}

// ============================================================================
// Verify CRC16
// ============================================================================
bool BinaryProtocol::verifyCRC(const uint8_t* buffer, size_t length) {
    if (length < sizeof(MessageHeader) + sizeof(uint16_t)) {
        return false;
    }
    
    // Extract CRC from end of message
    uint16_t receivedCRC;
    memcpy(&receivedCRC, buffer + length - sizeof(uint16_t), sizeof(uint16_t));
    
    // Calculate CRC over header + payload
    uint16_t calculatedCRC = calculateCRC16(buffer, length - sizeof(uint16_t));
    
    return (receivedCRC == calculatedCRC);
}
