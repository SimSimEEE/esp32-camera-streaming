/**
 * `GimbalProtocol.java`
 * - Binary protocol definitions for ESP32 gimbal telemetry/control
 * - Matches ESP32 Protocol.h specification exactly
 * - Little-endian byte order, CRC16 MODBUS verification
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-21 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */
package io.granule.camera.server.module;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

/**
 * Binary protocol definitions for gimbal communication
 * Protocol: [Header 6B][Payload 0-40B][CRC16 2B]
 */
public class GimbalProtocol {
    
    // Protocol constants (match ESP32 Protocol.h)
    public static final int MAGIC_NUMBER = 0xAA55;
    public static final int PROTOCOL_VERSION = 0x01;
    
    // Message types
    public static final byte MSG_TYPE_TELEMETRY = 0x01;
    public static final byte MSG_TYPE_CONTROL = 0x02;
    public static final byte MSG_TYPE_PID_UPDATE = 0x03;
    public static final byte MSG_TYPE_HEARTBEAT = 0x04;
    
    // Message sizes
    public static final int HEADER_SIZE = 6;
    public static final int TELEMETRY_SIZE = 40;
    public static final int CONTROL_SIZE = 8;
    public static final int PID_UPDATE_SIZE = 24;
    public static final int HEARTBEAT_SIZE = 8;
    public static final int CRC_SIZE = 2;
    
    // CRC16 MODBUS polynomial
    private static final int CRC16_POLY = 0xA001;
    
    /**
     * Message Header (6 bytes)
     */
    public static class MessageHeader {
        public final int magic;          // 2 bytes (0xAA55)
        public final int version;        // 1 byte (0x01)
        public final byte messageType;   // 1 byte
        public final int payloadLength;  // 2 bytes
        
        public MessageHeader(final int magic, final int version, final byte messageType, final int payloadLength) {
            this.magic = magic;
            this.version = version;
            this.messageType = messageType;
            this.payloadLength = payloadLength;
        }
        
        /**
         * Parse header from ByteBuffer
         */
        public static MessageHeader parse(final ByteBuffer buffer) {
            if (buffer.remaining() < HEADER_SIZE) {
                throw new IllegalArgumentException("Buffer too small for header: " + buffer.remaining());
            }
            
            final int magic = buffer.getShort() & 0xFFFF;
            final int version = buffer.get() & 0xFF;
            final byte messageType = buffer.get();
            final int payloadLength = buffer.getShort() & 0xFFFF;
            
            return new MessageHeader(magic, version, messageType, payloadLength);
        }
        
        /**
         * Validate header fields
         */
        public final boolean isValid() {
            return magic == MAGIC_NUMBER && version == PROTOCOL_VERSION;
        }
        
        @Override
        public final String toString() {
            return String.format("Header{magic=0x%04X, ver=%d, type=0x%02X, len=%d}",
                    magic, version, messageType, payloadLength);
        }
    }
    
    /**
     * Telemetry Payload (40 bytes)
     * ESP32 → Server → Dashboards
     */
    public static class TelemetryPayload {
        public final long timestamp;       // 4 bytes (uint32_t)
        public final float pitchAngle;     // 4 bytes
        public final float rollAngle;      // 4 bytes
        public final float yawAngle;       // 4 bytes (reserved)
        public final float pitchRate;      // 4 bytes
        public final float rollRate;       // 4 bytes
        public final float pitchPidOutput; // 4 bytes
        public final float rollPidOutput;  // 4 bytes
        public final long freeHeap;        // 4 bytes (uint32_t)
        public final int cpuUsage;         // 4 bytes (uint32_t)
        
        public TelemetryPayload(final long timestamp, final float pitchAngle, final float rollAngle,
                final float yawAngle, final float pitchRate, final float rollRate,
                final float pitchPidOutput, final float rollPidOutput,
                final long freeHeap, final int cpuUsage) {
            this.timestamp = timestamp;
            this.pitchAngle = pitchAngle;
            this.rollAngle = rollAngle;
            this.yawAngle = yawAngle;
            this.pitchRate = pitchRate;
            this.rollRate = rollRate;
            this.pitchPidOutput = pitchPidOutput;
            this.rollPidOutput = rollPidOutput;
            this.freeHeap = freeHeap;
            this.cpuUsage = cpuUsage;
        }
        
        /**
         * Parse telemetry from ByteBuffer
         */
        public static TelemetryPayload parse(final ByteBuffer buffer) {
            if (buffer.remaining() < TELEMETRY_SIZE) {
                throw new IllegalArgumentException("Buffer too small for telemetry: " + buffer.remaining());
            }
            
            final long timestamp = Integer.toUnsignedLong(buffer.getInt());
            final float pitchAngle = buffer.getFloat();
            final float rollAngle = buffer.getFloat();
            final float yawAngle = buffer.getFloat();
            final float pitchRate = buffer.getFloat();
            final float rollRate = buffer.getFloat();
            final float pitchPidOutput = buffer.getFloat();
            final float rollPidOutput = buffer.getFloat();
            final long freeHeap = Integer.toUnsignedLong(buffer.getInt());
            final int cpuUsage = buffer.getInt();
            
            return new TelemetryPayload(timestamp, pitchAngle, rollAngle, yawAngle,
                    pitchRate, rollRate, pitchPidOutput, rollPidOutput, freeHeap, cpuUsage);
        }
        
        @Override
        public final String toString() {
            return String.format("Telemetry{ts=%d, pitch=%.2f°, roll=%.2f°, heap=%d, cpu=%d%%}",
                    timestamp, pitchAngle, rollAngle, freeHeap, cpuUsage);
        }
    }
    
    /**
     * Control Payload (8 bytes)
     * Dashboard → Server → ESP32
     */
    public static class ControlPayload {
        public final float targetPitch;  // 4 bytes
        public final float targetRoll;   // 4 bytes
        
        public ControlPayload(final float targetPitch, final float targetRoll) {
            this.targetPitch = targetPitch;
            this.targetRoll = targetRoll;
        }
        
        /**
         * Serialize control command to ByteBuffer
         */
        public final ByteBuffer serialize() {
            final ByteBuffer buffer = ByteBuffer.allocate(CONTROL_SIZE)
                    .order(ByteOrder.LITTLE_ENDIAN);
            buffer.putFloat(targetPitch);
            buffer.putFloat(targetRoll);
            buffer.flip();
            return buffer;
        }
        
        @Override
        public final String toString() {
            return String.format("Control{pitch=%.2f°, roll=%.2f°}", targetPitch, targetRoll);
        }
    }
    
    /**
     * PID Update Payload (24 bytes)
     * Dashboard → Server → ESP32
     */
    public static class PIDUpdatePayload {
        public final byte axis;      // 1 byte (0=pitch, 1=roll)
        public final float kp;       // 4 bytes
        public final float ki;       // 4 bytes
        public final float kd;       // 4 bytes
        public final float minLimit; // 4 bytes
        public final float maxLimit; // 4 bytes
        // 3 bytes padding
        
        public PIDUpdatePayload(final byte axis, final float kp, final float ki, final float kd,
                final float minLimit, final float maxLimit) {
            this.axis = axis;
            this.kp = kp;
            this.ki = ki;
            this.kd = kd;
            this.minLimit = minLimit;
            this.maxLimit = maxLimit;
        }
        
        /**
         * Serialize PID update to ByteBuffer
         */
        public final ByteBuffer serialize() {
            final ByteBuffer buffer = ByteBuffer.allocate(PID_UPDATE_SIZE)
                    .order(ByteOrder.LITTLE_ENDIAN);
            buffer.put(axis);
            buffer.putFloat(kp);
            buffer.putFloat(ki);
            buffer.putFloat(kd);
            buffer.putFloat(minLimit);
            buffer.putFloat(maxLimit);
            // Padding
            buffer.put((byte) 0);
            buffer.put((byte) 0);
            buffer.put((byte) 0);
            buffer.flip();
            return buffer;
        }
        
        @Override
        public final String toString() {
            return String.format("PIDUpdate{axis=%d, Kp=%.3f, Ki=%.3f, Kd=%.3f}",
                    axis, kp, ki, kd);
        }
    }
    
    /**
     * Heartbeat Payload (8 bytes)
     * Bidirectional keep-alive
     */
    public static class HeartbeatPayload {
        public final long timestamp;  // 4 bytes (uint32_t)
        public final long sequence;   // 4 bytes (uint32_t)
        
        public HeartbeatPayload(final long timestamp, final long sequence) {
            this.timestamp = timestamp;
            this.sequence = sequence;
        }
        
        /**
         * Parse heartbeat from ByteBuffer
         */
        public static HeartbeatPayload parse(final ByteBuffer buffer) {
            if (buffer.remaining() < HEARTBEAT_SIZE) {
                throw new IllegalArgumentException("Buffer too small for heartbeat: " + buffer.remaining());
            }
            
            final long timestamp = Integer.toUnsignedLong(buffer.getInt());
            final long sequence = Integer.toUnsignedLong(buffer.getInt());
            
            return new HeartbeatPayload(timestamp, sequence);
        }
        
        /**
         * Serialize heartbeat to ByteBuffer
         */
        public final ByteBuffer serialize() {
            final ByteBuffer buffer = ByteBuffer.allocate(HEARTBEAT_SIZE)
                    .order(ByteOrder.LITTLE_ENDIAN);
            buffer.putInt((int) timestamp);
            buffer.putInt((int) sequence);
            buffer.flip();
            return buffer;
        }
        
        @Override
        public final String toString() {
            return String.format("Heartbeat{ts=%d, seq=%d}", timestamp, sequence);
        }
    }
    
    /**
     * Calculate CRC16 MODBUS (polynomial 0xA001)
     * Matches ESP32 implementation exactly
     */
    public static int calculateCRC16(final byte[] data, final int length) {
        int crc = 0xFFFF;
        
        for (int i = 0; i < length; i++) {
            crc ^= (data[i] & 0xFF);
            
            for (int j = 0; j < 8; j++) {
                if ((crc & 0x0001) != 0) {
                    crc >>= 1;
                    crc ^= CRC16_POLY;
                } else {
                    crc >>= 1;
                }
            }
        }
        
        return crc & 0xFFFF;
    }
    
    /**
     * Verify CRC16 of received message
     */
    public static boolean verifyCRC(final byte[] data, final int dataLength, final int receivedCrc) {
        final int calculatedCrc = calculateCRC16(data, dataLength);
        return calculatedCrc == receivedCrc;
    }
    
    /**
     * Build complete binary message with header + payload + CRC
     */
    public static byte[] buildMessage(final byte messageType, final ByteBuffer payload) {
        final int payloadSize = payload.remaining();
        final int totalSize = HEADER_SIZE + payloadSize + CRC_SIZE;
        
        final ByteBuffer message = ByteBuffer.allocate(totalSize)
                .order(ByteOrder.LITTLE_ENDIAN);
        
        // Header
        message.putShort((short) MAGIC_NUMBER);
        message.put((byte) PROTOCOL_VERSION);
        message.put(messageType);
        message.putShort((short) payloadSize);
        
        // Payload
        message.put(payload);
        
        // Calculate CRC (header + payload)
        final byte[] dataForCrc = new byte[HEADER_SIZE + payloadSize];
        message.flip();
        message.get(dataForCrc);
        final int crc = calculateCRC16(dataForCrc, dataForCrc.length);
        
        // Append CRC
        message.putShort((short) crc);
        
        return message.array();
    }
}
