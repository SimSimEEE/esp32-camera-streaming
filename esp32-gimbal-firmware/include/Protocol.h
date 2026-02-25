/**
 * `Protocol.h`
 * - Binary WebSocket Protocol Definitions for ESP32 Gimbal System
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-25 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

#ifndef PROTOCOL_H
#define PROTOCOL_H

#include <stdint.h>

// ============================================================================
// Protocol Constants
// ============================================================================
#define PROTOCOL_MAGIC          0xAA55      // 16-bit magic number
#define PROTOCOL_VERSION        0x01        // Version 1

// Message Types
#define MSG_TYPE_TELEMETRY      0x01        // ESP32 → Server: Telemetry data
#define MSG_TYPE_CONTROL        0x02        // Server → ESP32: Control command
#define MSG_TYPE_PID_UPDATE     0x03        // Server → ESP32: PID gain update
#define MSG_TYPE_HEARTBEAT      0x04        // Bidirectional: Keep-alive
#define MSG_TYPE_ACK            0x0F        // Bidirectional: Acknowledgement

// Payload Sizes (bytes)
#define TELEMETRY_PAYLOAD_SIZE  40
#define CONTROL_PAYLOAD_SIZE    8
#define PID_UPDATE_PAYLOAD_SIZE 24
#define HEARTBEAT_PAYLOAD_SIZE  8

// Total Message Sizes (Header + Payload + CRC)
#define TELEMETRY_MSG_SIZE      (6 + TELEMETRY_PAYLOAD_SIZE + 2)   // 48 bytes
#define CONTROL_MSG_SIZE        (6 + CONTROL_PAYLOAD_SIZE + 2)     // 16 bytes
#define PID_UPDATE_MSG_SIZE     (6 + PID_UPDATE_PAYLOAD_SIZE + 2)  // 32 bytes
#define HEARTBEAT_MSG_SIZE      (6 + HEARTBEAT_PAYLOAD_SIZE + 2)   // 16 bytes

// ============================================================================
// Message Header (6 bytes)
// ============================================================================
#pragma pack(push, 1)
struct MessageHeader {
    uint16_t magic;         // 0xAA55
    uint8_t  version;       // 0x01
    uint8_t  type;          // Message type
    uint16_t payloadSize;   // Payload length in bytes
};
#pragma pack(pop)

// ============================================================================
// Telemetry Message Payload (40 bytes)
// ESP32 → Server
// ============================================================================
#pragma pack(push, 1)
struct TelemetryPayload {
    // Timestamp
    uint32_t timestamp;         // ms since boot
    
    // Attitude (12 bytes)
    float    pitch;             // degrees
    float    roll;              // degrees
    float    yaw;               // degrees
    
    // Servo positions (8 bytes)
    float    servoPitch;        // degrees
    float    servoRoll;         // degrees
    
    // System metrics (16 bytes)
    uint32_t freeHeap;          // bytes
    uint8_t  cpuLoad;           // 0-100%
    int8_t   rssi;              // WiFi signal strength (dBm)
    uint8_t  taskErrors;        // Error counter
    uint8_t  reserved1;         // Padding
    uint32_t loopCount;         // Total control loops executed
    uint32_t reserved2;         // Reserved for future use
};
#pragma pack(pop)

// ============================================================================
// Control Command Payload (8 bytes)
// Server → ESP32
// ============================================================================
#pragma pack(push, 1)
struct ControlPayload {
    float    targetPitch;       // Target pitch angle (degrees)
    float    targetRoll;        // Target roll angle (degrees)
};
#pragma pack(pop)

// ============================================================================
// PID Update Payload (24 bytes)
// Server → ESP32
// ============================================================================
#pragma pack(push, 1)
struct PIDUpdatePayload {
    uint8_t  axis;              // 0=pitch, 1=roll
    uint8_t  reserved[3];       // Padding to 4-byte alignment
    
    float    kp;                // Proportional gain
    float    ki;                // Integral gain
    float    kd;                // Derivative gain
    
    float    integralMin;       // Anti-windup min
    float    integralMax;       // Anti-windup max
};
#pragma pack(pop)

// ============================================================================
// Heartbeat Payload (8 bytes)
// Bidirectional
// ============================================================================
#pragma pack(push, 1)
struct HeartbeatPayload {
    uint32_t timestamp;         // Sender timestamp (ms)
    uint8_t  systemStatus;      // 0=OK, 1=Warning, 2=Error
    uint8_t  reserved[3];       // Padding
};
#pragma pack(pop)

// ============================================================================
// Complete Message Structures
// ============================================================================
#pragma pack(push, 1)
struct TelemetryMessage {
    MessageHeader       header;
    TelemetryPayload    payload;
    uint16_t            crc16;
};
#pragma pack(pop)

#pragma pack(push, 1)
struct ControlMessage {
    MessageHeader       header;
    ControlPayload      payload;
    uint16_t            crc16;
};
#pragma pack(pop)

#pragma pack(push, 1)
struct PIDUpdateMessage {
    MessageHeader       header;
    PIDUpdatePayload    payload;
    uint16_t            crc16;
};
#pragma pack(pop)

#pragma pack(push, 1)
struct HeartbeatMessage {
    MessageHeader       header;
    HeartbeatPayload    payload;
    uint16_t            crc16;
};
#pragma pack(pop)

// ============================================================================
// Compile-time Size Assertions
// ============================================================================
static_assert(sizeof(MessageHeader) == 6, "MessageHeader must be 6 bytes");
static_assert(sizeof(TelemetryPayload) == 40, "TelemetryPayload must be 40 bytes");
static_assert(sizeof(ControlPayload) == 8, "ControlPayload must be 8 bytes");
static_assert(sizeof(PIDUpdatePayload) == 24, "PIDUpdatePayload must be 24 bytes");
static_assert(sizeof(HeartbeatPayload) == 8, "HeartbeatPayload must be 8 bytes");
static_assert(sizeof(TelemetryMessage) == 48, "TelemetryMessage must be 48 bytes");
static_assert(sizeof(ControlMessage) == 16, "ControlMessage must be 16 bytes");
static_assert(sizeof(PIDUpdateMessage) == 32, "PIDUpdateMessage must be 32 bytes");
static_assert(sizeof(HeartbeatMessage) == 16, "HeartbeatMessage must be 16 bytes");

#endif // PROTOCOL_H
