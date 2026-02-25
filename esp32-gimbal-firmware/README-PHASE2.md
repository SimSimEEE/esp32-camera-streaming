# ESP32 Gimbal Firmware - Phase 2: PID Control & Servo Integration

**Status**: ✅ Phase 2 Complete - Ready for Testing  
**Author**: Sim U Geun <sim@lemoncloud.io>  
**Date**: 2025-02-03  

---

## 📋 Overview

**Phase 2** completes the gimbal control loop with PID controllers and servo motor integration. The system now actively stabilizes the gimbal to a target angle using dual-core FreeRTOS task coordination.

### Key Features
- ✅ PID controller with anti-windup and derivative filtering
- ✅ Dual-axis servo control (pitch, roll) via ESP32 LEDC (PWM)
- ✅ FreeRTOS multi-core task architecture:
  - Core 0: Sensor task (100Hz) - MPU6050 reading + complementary filter
  - Core 1: Control task (50Hz) - PID computation + servo output
- ✅ Thread-safe data sharing between tasks
- ✅ Real-time debugging output with PID terms

---

## 🏗️ Architecture

### System Flow
```
┌─────────────────────────────────────────────────────────┐
│                  ESP32 Dual-Core System                 │
├─────────────────────────────────────────────────────────┤
│  Core 0 (Protocol CPU)    │    Core 1 (App CPU)         │
│  ┌────────────────────┐  │  ┌────────────────────────┐ │
│  │  Sensor Task       │  │  │  Control Task          │ │
│  │  (Priority 2)      │  │  │  (Priority 4)          │ │
│  │  100Hz / 10ms      │  │  │  50Hz / 20ms           │ │
│  └─────────┬──────────┘  │  └──────────┬─────────────┘ │
│            │              │             │               │
│       ┌────▼─────┐        │        ┌────▼────┐         │
│       │ MPU6050  │        │        │  PID x2 │         │
│       │ I2C Read │        │        │ (P+I+D) │         │
│       └────┬─────┘        │        └────┬────┘         │
│            │              │             │               │
│       ┌────▼─────┐        │        ┌────▼────┐         │
│       │Comp.     │        │        │ Servo   │         │
│       │Filter    │        │        │ LEDC    │         │
│       └────┬─────┘        │        └────┬────┘         │
│            │              │             │               │
│       ┌────▼─────────┐    │        ┌────▼────┐         │
│       │ Mutex Write  │◄───┼────────┤Mutex Rd │         │
│       │latestAttitude│    │        │         │         │
│       └──────────────┘    │        └─────────┘         │
│                           │                             │
│                      ┌────▼────┐                        │
│                      │ Loop()  │                        │
│                      │ Debug   │                        │
│                      └─────────┘                        │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 New Files (Phase 2)

```
esp32-gimbal-firmware/
├── src/
│   ├── control/
│   │   ├── PIDController.h         # PID controller header
│   │   ├── PIDController.cpp       # PID implementation (anti-windup, filtering)
│   │   ├── ServoController.h       # Servo motor header
│   │   └── ServoController.cpp     # LEDC-based servo control
│   └── main.cpp                    # Updated with control task
└── README-PHASE2.md                # This file
```

---

## 🎛️ PID Controller Features

### 1. **Proportional Term (P)**
```cpp
pTerm = Kp * error
```
- Responds to current error
- Higher Kp = faster response, more overshoot

### 2. **Integral Term (I) with Anti-Windup**
```cpp
integral += error * dt;
integral = clamp(integral, -10.0, 10.0);  // Anti-windup
iTerm = Ki * integral;
```
- Eliminates steady-state error
- Anti-windup prevents integral saturation

### 3. **Derivative Term (D) with Filtering**
```cpp
derivative = (error - prevError) / dt;
filteredD = 0.8 * prevD + 0.2 * derivative;  // Low-pass filter
dTerm = Kd * filteredD;
```
- Dampens oscillations
- Filtering reduces noise sensitivity

### PID Tuning Guide

**Default values** (from Config.h):
```cpp
Kp = 1.0, Ki = 0.0, Kd = 0.0
```

**Ziegler-Nichols Method:**
1. Set Ki=0, Kd=0
2. Increase Kp until oscillation starts (Ku)
3. Measure oscillation period (Tu)
4. Calculate:
   - Kp = 0.6 * Ku
   - Ki = 2 * Kp / Tu
   - Kd = Kp * Tu / 8

---

## 🔧 Servo Controller Features

### LEDC (LED Control) Peripheral
ESP32's LEDC generates precise PWM signals:
- **Channels**: 0 (pitch), 1 (roll)
- **Resolution**: 16-bit (0 ~ 65535)
- **Frequency**: 50Hz (standard servo)

### Angle to PWM Conversion
```cpp
// -90° → 500us, 0° → 1500us, +90° → 2500us
pulseUs = 500 + normalize(angle) * 2000;
duty = (pulseUs / 20000us) * 65535;
ledcWrite(channel, duty);
```

### Servo Limits
```cpp
angleMin = -90°
angleMax = +90°
```

---

## 🚀 Quick Start

### 1. Hardware Connections

```
ESP32-CAM                 MPU6050
---------                 -------
GPIO 21 (SDA) ──────────► SDA
GPIO 22 (SCL) ──────────► SCL
3.3V          ──────────► VCC
GND           ──────────► GND

ESP32-CAM                 Servos
---------                 ------
GPIO 12       ──────────► Pitch Servo Signal
GPIO 13       ──────────► Roll Servo Signal
5V (External) ──────────► Servo VCC (both)
GND           ──────────► Servo GND (both)
```

**Important**: Servos require 5V and can draw 500mA+ under load. Use external power supply!

### 2. Upload Firmware

```bash
cd esp32-gimbal-firmware
pio run --target upload
pio device monitor
```

### 3. Expected Serial Output

```
==============================================
ESP32 Gimbal Control System - Phase 2
PID Control + Servo Integration
==============================================

[Setup] Initializing MPU6050 sensor...
[MPU6050] Sensor initialized successfully

[Setup] Calibrating sensor (keep gimbal stationary)...
[MPU6050] Calibration complete:
  Accel offsets: X=0.12, Y=-0.05, Z=0.08 m/s^2
  Gyro offsets: X=0.002, Y=-0.001, Z=0.0007 rad/s

[Setup] Initializing servo motors...
[Servo] Initializing on pins: Pitch=12, Roll=13, Freq=50Hz
[Servo] Initialization complete
[Servo] Centered

[Setup] Creating FreeRTOS tasks...
[PID] Initialized: Kp=1.000, Ki=0.000, Kd=0.000
[Task:Sensor] Started on Core 0
[Task:Control] Started on Core 1

[Setup] System initialization complete
==============================================

========================================
[Current] Pitch:  -2.34°  Roll:   1.45°
[Target]  Pitch:   0.00°  Roll:   0.00°
[PID Out] Pitch:   2.34°  Roll:  -1.45°
[Servo]   Pitch:   2.34°  Roll:  -1.45°
[PID-P]   P=2.34  I=0.00  D=0.00
[Heap]    Free: 267892 bytes
========================================
```

---

## 🧪 Testing

### Test 1: Sensor → PID → Servo Chain
1. Upload firmware
2. Tilt gimbal manually (pitch/roll)
3. Observe servo compensating to maintain 0° target
4. Expected: Gimbal returns to level within 2 seconds

### Test 2: PID Step Response
1. Manually set `targetPitch = 30.0f` in code
2. Re-upload
3. Observe settling time and overshoot
4. Expected: Reaches 30° ± 1° in < 2s

### Test 3: Free Heap Monitoring
1. Run for 5+ minutes
2. Monitor `[Heap] Free: X bytes` output
3. Expected: No decrease (no memory leak)

---

## 📊 Performance Metrics (Phase 2)

| Metric               | Target    | Achieved |
| -------------------- | --------- | -------- |
| **RAM Usage**        | < 10%     | 6.9%     |
| **Flash Usage**      | < 20%     | 10.2%    |
| **Sensor Rate**      | 100Hz     | 100Hz    |
| **Control Rate**     | 50Hz      | 50Hz     |
| **Settling Time**    | < 2s      | TBD      |
| **Steady-State Err** | ± 1°      | TBD      |
| **Overshoot**        | < 10%     | TBD      |

**TBD** = To Be Determined (requires hardware testing)

---

## 🔜 Next Steps (Phase 3)

1. **Binary WebSocket Protocol**
   - Message types: Telemetry, ControlCommand, PIDUpdate
   - CRC16 validation
   - Struct serialization

2. **WebSocket Client**
   - Connect to Java server
   - Send telemetry (10Hz)
   - Receive control commands

3. **Runtime PID Tuning**
   - Receive PIDUpdate messages
   - Update gains dynamically
   - Save to EEPROM

---

## 🛠️ Troubleshooting

### Servo doesn't move
- **Check power**: Servos need 5V, 500mA+
- **Test PWM**: Verify LEDC signals with oscilloscope
- **Range limits**: Default is ±90°, check if `angleMin`/`angleMax` are too restrictive

### PID oscillates continuously
- **Too high Kp**: Reduce by 50% and re-test
- **Missing D term**: Add Kd = Kp * 0.1
- **Sensor noise**: Increase complementary filter alpha (0.96 → 0.98)

### Control task crashes
- **Stack overflow**: Increase `TASK_STACK_CONTROL` (3072 → 4096)
- **Check free heap**: Should be > 200KB
- **Mutex deadlock**: Ensure all `xSemaphoreTake` have `xSemaphoreGive`

### Gimbal drifts slowly
- **Integral windup**: Check if I term saturates at ±10
- **Sensor calibration**: Re-run calibration when stationary
- **External disturbance**: Add friction dampening to mechanical gimbal

---

## 📚 References

- [ESP32 LEDC API](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/peripherals/ledc.html)
- [PID Tuning Guide](https://en.wikipedia.org/wiki/Ziegler%E2%80%93Nichols_method)
- [FreeRTOS Core Affinity](https://www.freertos.org/xTaskCreatePinnedToCore.html)

---

**Phase Completion**: ✅ PID + Servo integration done, ready for Phase 3 (WebSocket communication)
