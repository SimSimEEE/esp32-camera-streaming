/**
 * `GimbalProtocol.java`
 * - Binary protocol definitions for ESP32 Gimbal communication
 * - Matches ESP32 Protocol.h specification
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-26 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */
package io.granule.camera.server.gimbal;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * Binary WebSocket Protocol for ESP32 Gimbal System
 * Protocol Version: 1.0
 */
public class GimbalProtocol {
    
    // Protocol Constants
    public static final short PROTOCOL_MAGIC = (short) 0xAA55;
    public static final byte PROTOCOL_VERSION = 0x01;
    
    // Message Types
    public static final byte MSG_TYPE_TELEMETRY = 0x01;
    public static final byte MSG_TYPE_CONTROL = 0x02;
    public static final byte MSG_TYPE_PID_UPDATE = 0x03;
    public static final byte MSG_TYPE_HEARTBEAT = 0x04;
    public static final byte MSG_TYPE_ACK = 0x0F;
    
    // Message Sizes
    public static final int HEADER_SIZE = 6;
    public static final int CRC_SIZE = 2;
    public static final int TELEMETRY_PAYLOAD_SIZE = 40;
    public static final int CONTROL_PAYLOAD_SIZE = 8;
    public static final int PID_UPDATE_PAYLOAD_SIZE = 24;
    public static final int HEARTBEAT_PAYLOAD_SIZE = 8;
    
    public static final int TELEMETRY_MSG_SIZE = HEADER_SIZE + TELEMETRY_PAYLOAD_SIZE + CRC_SIZE;
    public static final int CONTROL_MSG_SIZE = HEADER_SIZE + CONTROL_PAYLOAD_SIZE + CRC_SIZE;
    public static final int PID_UPDATE_MSG_SIZE = HEADER_SIZE + PID_UPDATE_PAYLOAD_SIZE + CRC_SIZE;
    public static final int HEARTBEAT_MSG_SIZE = HEADER_SIZE + HEARTBEAT_PAYLOAD_SIZE + CRC_SIZE;
    
    /**
     * Message Header (6 bytes)
     */
    public static class MessageHeader {
        public short magic;         // 0xAA55
        public byte version;        // 0x01
        public byte type;           // Message type
        public short payloadSize;   // Payload length
        
        public static MessageHeader parse(ByteBuffer buffer) {
            MessageHeader header = new MessageHeader();
            header.magic = buffer.getShort();
            header.version = buffer.get();
            header.type = buffer.get();
            header.payloadSize = buffer.getShort();
            return header;
        }
        
        public boolean isValid() {
            return magic == PROTOCOL_MAGIC && version == PROTOCOL_VERSION;
        }
    }
    
    /**
     * Telemetry Message Payload (40 bytes)
     * ESP32 → Server
     */
    public static class TelemetryPayload {
        public long timestamp;      // uint32_t - ms since boot
        
        // Attitude (12 bytes)
        public float pitch;         // degrees
        public float roll;          // degrees
        public float yaw;           // degrees
        
        // Servo positions (8 bytes)
        public float servoPitch;    // degrees
        public float servoRoll;     // degrees
        
        // System metrics (16 bytes)
        public long freeHeap;       // uint32_t - bytes
        public short cpuLoad;       // uint8_t - 0-100%
        public byte rssi;           // int8_t - WiFi signal (dBm)
        public short taskErrors;    // uint8_t - error counter
        public long loopCount;      // uint32_t - control loops
        public long reserved;       // uint32_t - future use
        
        public static TelemetryPayload parse(ByteBuffer buffer) {
            TelemetryPayload payload = new TelemetryPayload();
            
            payload.timestamp = Integer.toUnsignedLong(buffer.getInt());
            
            // Attitude
            payload.pitch = buffer.getFloat();
            payload.roll = buffer.getFloat();
            payload.yaw = buffer.getFloat();
            
            // Servo positions
            payload.servoPitch = buffer.getFloat();
            payload.servoRoll = buffer.getFloat();
            
            // System metrics
            payload.freeHeap = Integer.toUnsignedLong(buffer.getInt());
            payload.cpuLoad = (short) (buffer.get() & 0xFF);
            payload.rssi = buffer.get();
            payload.taskErrors = (short) (buffer.get() & 0xFF);
            buffer.get(); // reserved1 (padding)
            payload.loopCount = Integer.toUnsignedLong(buffer.getInt());
            payload.reserved = Integer.toUnsignedLong(buffer.getInt());
            
            return payload;
        }
    }
    
    /**
     * Control Command Payload (8 bytes)
     * Server → ESP32
     */
    public static class ControlPayload {
        public float targetPitch;   // degrees
        public float targetRoll;    // degrees
        
        public byte[] serialize() {
            ByteBuffer buffer = ByteBuffer.allocate(CONTROL_PAYLOAD_SIZE);
            buffer.order(ByteOrder.LITTLE_ENDIAN);
            buffer.putFloat(targetPitch);
            buffer.putFloat(targetRoll);
            return buffer.array();
        }
    }
    
    /**
     * PID Update Payload (24 bytes)
     * Server → ESP32
     */
    public static class PIDUpdatePayload {
        public byte axis;           // 0=pitch, 1=roll
        public float kp;            // Proportional gain
        public float ki;            // Integral gain
        public float kd;            // Derivative gain
        public float integralMin;   // Anti-windup min
        public float integralMax;   // Anti-windup max
        
        public byte[] serialize() {
            ByteBuffer buffer = ByteBuffer.allocate(PID_UPDATE_PAYLOAD_SIZE);
            buffer.order(ByteOrder.LITTLE_ENDIAN);
            buffer.put(axis);
            buffer.put((byte) 0); // reserved[0]
            buffer.put((byte) 0); // reserved[1]
            buffer.put((byte) 0); // reserved[2]
            buffer.putFloat(kp);
            buffer.putFloat(ki);
            buffer.putFloat(kd);
            buffer.putFloat(integralMin);
            buffer.putFloat(integralMax);
            return buffer.array();
        }
    }
    
    /**
     * Heartbeat Payload (8 bytes)
     * Bidirectional
     */
    public static class HeartbeatPayload {
        public long timestamp;      // uint32_t - ms
        public byte systemStatus;   // 0=OK, 1=Warning, 2=Error
        
        public byte[] serialize() {
            ByteBuffer buffer = ByteBuffer.allocate(HEARTBEAT_PAYLOAD_SIZE);
            buffer.order(ByteOrder.LITTLE_ENDIAN);
            buffer.putInt((int) timestamp);
            buffer.put(systemStatus);
            buffer.put((byte) 0); // reserved[0]
            buffer.put((byte) 0); // reserved[1]
            buffer.put((byte) 0); // reserved[2]
            return buffer.array();
        }
    }
    
    /**
     * Calculate CRC16 (MODBUS/ARC polynomial: 0xA001)
     */
    public static short calculateCRC16(byte[] data) {
        int crc = 0x0000;
        
        for (byte b : data) {
            crc ^= (b & 0xFF);
            
            for (int i = 0; i < 8; i++) {
                if ((crc & 0x0001) != 0) {
                    crc = (crc >>> 1) ^ 0xA001;
                } else {
                    crc >>>= 1;
                }
            }
        }
        
        return (short) crc;
    }
    
    /**
     * Verify CRC16 of received message
     */
    public static boolean verifyCRC(ByteBuffer buffer) {
        int totalSize = buffer.limit();
        if (totalSize < HEADER_SIZE + CRC_SIZE) {
            return false;
        }
        
        // Extract CRC from end of message
        buffer.position(totalSize - CRC_SIZE);
        short receivedCRC = buffer.getShort();
        
        // Calculate CRC over header + payload
        byte[] data = new byte[totalSize - CRC_SIZE];
        buffer.position(0);
        buffer.get(data);
        
        short calculatedCRC = calculateCRC16(data);
        
        return receivedCRC == calculatedCRC;
    }
    
    /**
     * Build complete binary message with header and CRC
     */
    public static byte[] buildMessage(byte type, byte[] payload) {
        int totalSize = HEADER_SIZE + payload.length + CRC_SIZE;
        ByteBuffer buffer = ByteBuffer.allocate(totalSize);
        buffer.order(ByteOrder.LITTLE_ENDIAN);
        
        // Header
        buffer.putShort(PROTOCOL_MAGIC);
        buffer.put(PROTOCOL_VERSION);
        buffer.put(type);
        buffer.putShort((short) payload.length);
        
        // Payload
        buffer.put(payload);
        
        // Calculate CRC over header + payload
        byte[] headerAndPayload = new byte[HEADER_SIZE + payload.length];
        buffer.position(0);
        buffer.get(headerAndPayload);
        
        short crc = calculateCRC16(headerAndPayload);
        buffer.putShort(crc);
        
        return buffer.array();
    }
}
