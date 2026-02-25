/**
 * `BinaryProtocol.h`
 * - Binary message serialization/deserialization utilities
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-25 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

#ifndef BINARY_PROTOCOL_H
#define BINARY_PROTOCOL_H

#include "../include/Protocol.h"
#include <stdint.h>
#include <stddef.h>

/**
 * BinaryProtocol
 * - Handles binary message encoding/decoding with CRC16 validation
 */
class BinaryProtocol {
public:
    // ========================================================================
    // CRC16 Calculation (MODBUS/ARC variant)
    // ========================================================================
    /**
     * Calculate CRC16 checksum
     * @param data Pointer to data buffer
     * @param length Data length in bytes
     * @return CRC16 checksum
     */
    static uint16_t calculateCRC16(const uint8_t* data, size_t length);
    
    // ========================================================================
    // Message Serialization (ESP32 → Server)
    // ========================================================================
    /**
     * Serialize telemetry data into binary message
     * @param payload Telemetry data to send
     * @param buffer Output buffer (must be >= TELEMETRY_MSG_SIZE)
     * @return Number of bytes written
     */
    static size_t serializeTelemetry(const TelemetryPayload& payload, uint8_t* buffer);
    
    /**
     * Serialize heartbeat into binary message
     * @param payload Heartbeat data
     * @param buffer Output buffer (must be >= HEARTBEAT_MSG_SIZE)
     * @return Number of bytes written
     */
    static size_t serializeHeartbeat(const HeartbeatPayload& payload, uint8_t* buffer);
    
    // ========================================================================
    // Message Deserialization (Server → ESP32)
    // ========================================================================
    /**
     * Deserialize control command from binary message
     * @param buffer Input buffer containing complete message
     * @param length Buffer length
     * @param payload Output control payload
     * @return true if deserialization successful and CRC valid
     */
    static bool deserializeControl(const uint8_t* buffer, size_t length, ControlPayload& payload);
    
    /**
     * Deserialize PID update from binary message
     * @param buffer Input buffer containing complete message
     * @param length Buffer length
     * @param payload Output PID update payload
     * @return true if deserialization successful and CRC valid
     */
    static bool deserializePIDUpdate(const uint8_t* buffer, size_t length, PIDUpdatePayload& payload);
    
    // ========================================================================
    // Message Validation
    // ========================================================================
    /**
     * Validate message header
     * @param header Message header to validate
     * @return true if magic and version are correct
     */
    static bool validateHeader(const MessageHeader& header);
    
    /**
     * Verify CRC16 checksum of received message
     * @param buffer Complete message buffer
     * @param length Buffer length
     * @return true if CRC matches
     */
    static bool verifyCRC(const uint8_t* buffer, size_t length);

private:
    // Internal helpers
    static void buildHeader(MessageHeader& header, uint8_t type, uint16_t payloadSize);
};

#endif // BINARY_PROTOCOL_H
