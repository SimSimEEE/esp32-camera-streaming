# Phase 3: Binary WebSocket Protocol & Telemetry

**ESP32 Gimbal Control - Binary Communication Implementation**

## Overview

Phase 3 implements a complete binary WebSocket protocol for real-time bidirectional communication between ESP32 and the Java server. The system sends telemetry at 10Hz and receives control commands and PID updates.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ESP32 Gimbal System                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                          ┌──────────────┐     │
│  │ Sensor Task  │─────┐                    │ Control Task │     │
│  │   (100Hz)    │     │                    │    (50Hz)    │     │
│  │   Core 0     │     │                    │   Core 1     │     │
│  └──────────────┘     │                    └──────────────┘     │
│                       ▼                                          │
│              ┌─────────────────┐             ┌─────────────┐    │
│              │  Shared Mutex   │             │ Telemetry   │    │
│              │   (Attitude)    │────────────▶│    Task     │    │
│              └─────────────────┘             │   (10Hz)    │    │
│                       ▲                      │   Core 1    │    │
│                       │                      └──────┬──────┘    │
│                       │                             │           │
│              ┌────────┴──────────┐                  ▼           │
│              │  WebSocket Client │◀──────┐   [Binary Msg]      │
│              │   (Reconnect)     │       │         │           │
│              └────────┬──────────┘       │         │           │
│                       │                  │         │           │
└───────────────────────┼──────────────────┼─────────┼───────────┘
                        │                  │         │
                        ▼                  │         ▼
                   [Control Cmd]           │    [Telemetry]
                   [PID Update]            │         │
                        │                  │         │
                        │                  │         │
                    ┌───┴──────────────────┴─────────┴────┐
                    │   WebSocket Server (Java/Netty)     │
                    │   ws://192.168.1.100:8887/esp32     │
                    └──────────────────────────────────────┘
```

## Binary Protocol Specification

### Message Structure

All messages follow this format:

```
┌────────────────────────────────────────────────────┐
│  Header (6 bytes)                                  │
├────────────────────────────────────────────────────┤
│  Magic (0xAA55)           │ 2 bytes                │
│  Version (0x01)           │ 1 byte                 │
│  Type                     │ 1 byte                 │
│  Payload Size             │ 2 bytes (uint16_t)     │
├────────────────────────────────────────────────────┤
│  Payload (variable)                                │
├────────────────────────────────────────────────────┤
│  CRC16 (MODBUS)           │ 2 bytes                │
└────────────────────────────────────────────────────┘
```

### Message Types

| Type | Name         | Direction    | Size | Frequency |
|------|--------------|--------------|------|-----------|
| 0x01 | Telemetry    | ESP32→Server | 48B  | 10Hz      |
| 0x02 | Control      | Server→ESP32 | 16B  | On-demand |
| 0x03 | PID Update   | Server→ESP32 | 32B  | On-demand |
| 0x04 | Heartbeat    | Bidirectional| 16B  | 10s       |

### 0x01: Telemetry Message (48 bytes)

```c
struct TelemetryPayload {
    uint32_t timestamp;      // ms since boot
    
    // Attitude (12 bytes)
    float    pitch;          // degrees
    float    roll;           // degrees
    float    yaw;            // degrees
    
    // Servo positions (8 bytes)
    float    servoPitch;     // degrees
    float    servoRoll;      // degrees
    
    // System metrics (16 bytes)
    uint32_t freeHeap;       // bytes
    uint8_t  cpuLoad;        // 0-100%
    int8_t   rssi;           // WiFi signal (dBm)
    uint8_t  taskErrors;     // Error counter
    uint8_t  reserved1;      // Padding
    uint32_t loopCount;      // Control loops executed
    uint32_t reserved2;      // Future use
};
```

**Example**: 
```
AA 55 01 01 00 28  // Header: magic=0xAA55, ver=1, type=1, size=40
12 34 56 78        // timestamp = 0x78563412 (little-endian)
00 00 A0 41        // pitch = 20.0f
00 00 C8 41        // roll = 25.0f
00 00 00 00        // yaw = 0.0f
...
AB CD              // CRC16
```

### 0x02: Control Command (16 bytes)

```c
struct ControlPayload {
    float targetPitch;       // Target pitch angle (degrees)
    float targetRoll;        // Target roll angle (degrees)
};
```

**Usage**: Server sends target angles to ESP32. Control task immediately updates setpoints.

### 0x03: PID Update (32 bytes)

```c
struct PIDUpdatePayload {
    uint8_t  axis;           // 0=pitch, 1=roll
    uint8_t  reserved[3];    // Padding
    
    float    kp;             // Proportional gain
    float    ki;             // Integral gain
    float    kd;             // Derivative gain
    
    float    integralMin;    // Anti-windup min
    float    integralMax;    // Anti-windup max
};
```

**Usage**: Runtime PID tuning from web dashboard. ESP32 applies new gains without restart.

### 0x04: Heartbeat (16 bytes)

```c
struct HeartbeatPayload {
    uint32_t timestamp;      // Sender timestamp (ms)
    uint8_t  systemStatus;   // 0=OK, 1=Warning, 2=Error
    uint8_t  reserved[3];    // Padding
};
```

**Usage**: Keep-alive mechanism, sent every 10s bidirectionally.

## CRC16 Calculation

Uses **MODBUS/ARC** polynomial: `0xA001`

```c
uint16_t calculateCRC16(const uint8_t* data, size_t length) {
    uint16_t crc = 0x0000;
    for (size_t i = 0; i < length; i++) {
        crc ^= data[i];
        for (int j = 0; j < 8; j++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ 0xA001;
            } else {
                crc >>= 1;
            }
        }
    }
    return crc;
}
```

CRC is calculated over **header + payload** only (excludes CRC field itself).

## FreeRTOS Tasks

### Task 3: Telemetry Task

```c
void telemetryTask(void* parameter) {
    // Core: 1, Priority: 1 (low), Interval: 100ms (10Hz)
    
    while (true) {
        if (wsClient.isConnected()) {
            // Collect system metrics
            TelemetryPayload payload = telemetry.collect(
                pitch, roll, yaw,
                servoPitch, servoRoll,
                controlLoopCount
            );
            
            // Send via WebSocket
            wsClient.sendTelemetry(payload);
        }
        vTaskDelayUntil(&xLastWakeTime, 100ms);
    }
}
```

**Stack Size**: 2048 bytes  
**Frequency**: 10Hz (100ms interval)

## WebSocket Client

### Configuration

```c
#define WS_HOST             "192.168.1.100"
#define WS_PORT             8887
#define WS_ENDPOINT         "/esp32"
#define WS_RECONNECT_INTERVAL 5000  // 5 seconds
```

### Callbacks

```c
// Called when server sends control command
void onControlCommand(const ControlPayload& payload) {
    targetPitch = payload.targetPitch;
    targetRoll = payload.targetRoll;
}

// Called when server sends PID update
void onPIDUpdate(const PIDUpdatePayload& payload) {
    if (payload.axis == 0) {
        pidPitch.setGains(payload.kp, payload.ki, payload.kd);
    } else {
        pidRoll.setGains(payload.kp, payload.ki, payload.kd);
    }
}
```

### Auto-Reconnect

WebSocket client automatically reconnects every 5 seconds on connection loss:

```c
_ws.setReconnectInterval(WS_RECONNECT_INTERVAL);
```

## System Metrics Collection

### Free Heap

```c
uint32_t getFreeHeap() const {
    return ESP.getFreeHeap();
}
```

### WiFi RSSI

```c
int8_t getWiFiRSSI() const {
    if (WiFi.status() == WL_CONNECTED) {
        return static_cast<int8_t>(WiFi.RSSI());
    }
    return -100;  // No signal
}
```

### CPU Load

Estimated from idle task time deltas (simplified approach).

## Build Configuration

### Dependencies

```ini
lib_deps = 
    adafruit/Adafruit MPU6050@^2.2.4
    adafruit/Adafruit Unified Sensor@^1.1.15
    links2004/WebSockets@^2.4.1      # Binary WebSocket support
    bblanchon/ArduinoJson@^6.21.3    # Future JSON support
```

### Memory Usage

| Metric  | Phase 2 | Phase 3 | Change  |
|---------|---------|---------|---------|
| **RAM**   | 6.9%    | 14.1%   | +7.2%   |
| **Flash** | 10.2%   | 30.3%   | +20.1%  |

**Note**: Flash increase is mainly due to WebSocket library (~600KB).

## Serial Monitor Output

```
==========================================
ESP32 Gimbal Control System - Phase 3
PID Control + WebSocket Communication
==========================================

[WiFi] Connecting to WiFi...
  SSID: YOUR_WIFI_SSID
..........
[WiFi] Connected successfully!
  IP Address: 192.168.1.150
  RSSI: -45 dBm

[Setup] Initializing WebSocket client...
[WS] Initializing WebSocket: ws://192.168.1.100:8887/esp32
[Setup] WebSocket client configured

[Task:Sensor] Started on Core 0
[Task:Control] Started on Core 1
[Task:Telemetry] Started on Core 1

[WS] Connected to server: /esp32
[WS] Sent heartbeat: ts=12345

========================================
[WiFi]    Status: Connected, RSSI: -45 dBm
[WS]      Connected: YES, Sent: 10, Recv: 2
[Current] Pitch:   5.23°  Roll:  -2.15°
[Target]  Pitch:   0.00°  Roll:   0.00°
[PID Out] Pitch:  -5.23°  Roll:   2.15°
[Servo]   Pitch:  -5.23°  Roll:   2.15°
[Loops]   Control: 1234
[Heap]    Free: 265432 bytes
========================================

[WS Callback] Control: pitch=10.00, roll=5.00
[WS Callback] PID Update [PITCH]: Kp=1.500, Ki=0.100, Kd=0.050
```

## Testing Procedure

### 1. WiFi Configuration

Edit `Config.h`:
```c
#define WIFI_SSID           "YourWiFiName"
#define WIFI_PASSWORD       "YourPassword"
```

### 2. Server Address

Update WebSocket server IP:
```c
#define WS_HOST             "192.168.1.100"  // Your server IP
```

### 3. Build & Upload

```bash
cd esp32-gimbal-firmware
pio run -t upload
pio device monitor
```

### 4. Verify Connection

Check serial output for:
- WiFi connection: `[WiFi] Connected successfully!`
- WebSocket connection: `[WS] Connected to server`
- Telemetry sending: `[WS] Sent telemetry: pitch=...`

### 5. Send Control Command

From server (Python example):
```python
import struct
import websocket

# Connect to ESP32
ws = websocket.WebSocket()
ws.connect("ws://192.168.1.150:8887/esp32")  # ESP32 IP

# Create control message
header = struct.pack('<HBBH', 0xAA55, 0x01, 0x02, 8)  # magic, ver, type, size
payload = struct.pack('<ff', 10.0, 5.0)  # targetPitch, targetRoll
crc = calculate_crc16(header + payload)
message = header + payload + struct.pack('<H', crc)

ws.send_binary(message)
```

## Troubleshooting

### WiFi Won't Connect

- Check SSID/password in `Config.h`
- Verify WiFi is 2.4GHz (ESP32 doesn't support 5GHz)
- Increase timeout: `WIFI_CONNECT_TIMEOUT 20000`

### WebSocket Connection Failed

- Verify server is running: `netstat -an | grep 8887`
- Check firewall allows port 8887
- Ensure `WS_HOST` IP is correct
- Test with: `wscat -c ws://192.168.1.100:8887/esp32`

### No Telemetry Received

- Check WebSocket connection status: `[WS] Connected: YES`
- Verify telemetry task is running: `vTaskList()` in code
- Enable debug: `#define DEBUG_WEBSOCKET true`
- Check server logs for binary message reception

### CRC Errors

- Ensure byte order matches (little-endian)
- Verify CRC calculation algorithm (MODBUS polynomial)
- Check message size matches protocol spec

## Next Steps

✅ **Phase 3 Complete**: Binary WebSocket protocol and telemetry

➡️ **Phase 4**: Java server binary handler and React dashboard
   - Extend Java WebSocket server to parse binary messages
   - Implement React hooks for binary protocol
   - Create Three.js 3D gimbal viewer
   - Real-time telemetry graphs

## Files Added/Modified

### New Files
- `include/Protocol.h` - Binary message structures
- `src/protocol/BinaryProtocol.h` - Serialization/deserialization
- `src/protocol/BinaryProtocol.cpp` - CRC16 implementation
- `src/network/WebSocketClient.h` - WebSocket client interface
- `src/network/WebSocketClient.cpp` - Client implementation
- `src/telemetry/TelemetryCollector.h` - Metrics collection
- `src/telemetry/TelemetryCollector.cpp` - System metrics

### Modified Files
- `src/main.cpp` - WiFi setup, WebSocket integration, telemetry task
- `include/Config.h` - WiFi and WebSocket configuration

## Performance Metrics

| Metric                  | Value       |
|-------------------------|-------------|
| **Telemetry Frequency** | 10Hz        |
| **Message Size**        | 48 bytes    |
| **Bandwidth**           | 480 B/s     |
| **Task Priority**       | 1 (lowest)  |
| **Stack Usage**         | ~1.5KB      |
| **Reconnect Time**      | ~2 seconds  |

---

**Phase 3 Status**: ✅ **COMPLETE**  
**Build Status**: ✅ **SUCCESS** (RAM 14.1%, Flash 30.3%)  
**Next Phase**: Java server + React dashboard
