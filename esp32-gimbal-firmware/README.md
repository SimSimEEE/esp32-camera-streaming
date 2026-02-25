# ESP32 Gimbal Firmware - Phase 1: Sensor Integration

**Status**: ✅ Phase 1 Complete - Ready for Testing  
**Author**: Sim U Geun <sim@lemoncloud.io>  
**Date**: 2025-02-03  

---

## 📋 Overview

This is the **Phase 1** implementation of the ESP32-based 2-axis gimbal control system. The goal of this phase is to establish reliable IMU sensor reading and attitude estimation using a complementary filter.

### Key Features
- ✅ MPU6050 6-axis IMU sensor driver
- ✅ Automatic sensor calibration (1000 samples)
- ✅ Complementary filter (α=0.96) for sensor fusion
- ✅ FreeRTOS task on Core 0 (100Hz sensor reading)
- ✅ Thread-safe data sharing with mutex
- ✅ Serial debugging output

---

## 🏗️ Architecture

### Hardware
- **MCU**: ESP32-CAM (240MHz, dual-core)
- **IMU**: MPU6050 (I2C @ 400kHz)
  - Accelerometer: ±4G range
  - Gyroscope: ±500°/s range
  - Filter: 21Hz bandwidth
- **Pins**:
  - SDA: GPIO 21
  - SCL: GPIO 22

### Software
```
┌─────────────────────────────────────────┐
│         FreeRTOS Scheduler              │
├─────────────────────────────────────────┤
│  Core 0                │  Core 1        │
│  ┌──────────────────┐ │  ┌──────────┐  │
│  │  Sensor Task     │ │  │  Loop    │  │
│  │  (100Hz, Prio 4) │ │  │  (Debug) │  │
│  └────────┬─────────┘ │  └─────┬────┘  │
│           │            │        │       │
│      ┌────▼────────┐  │   ┌────▼────┐  │
│      │ MPU6050     │  │   │ Serial  │  │
│      │ I2C Driver  │  │   │ Print   │  │
│      └────┬────────┘  │   └─────────┘  │
│           │            │                │
│      ┌────▼────────┐  │                │
│      │Complementary│  │                │
│      │   Filter    │  │                │
│      └────┬────────┘  │                │
│           │            │                │
│      ┌────▼────────┐  │                │
│      │ Data Mutex  │◄─┼────────────────┤
│      │ latestData  │  │                │
│      └─────────────┘  │                │
└─────────────────────────────────────────┘
```

---

## 📂 File Structure

```
esp32-gimbal-firmware/
├── platformio.ini              # PlatformIO configuration
├── include/
│   └── Config.h                # System-wide configuration
├── src/
│   ├── main.cpp                # Entry point + FreeRTOS tasks
│   ├── sensors/
│   │   ├── MPU6050Sensor.h     # Sensor driver header
│   │   └── MPU6050Sensor.cpp   # Sensor driver implementation
│   └── filters/
│       ├── ComplementaryFilter.h    # Filter header
│       └── ComplementaryFilter.cpp  # Filter implementation
└── README.md                   # This file
```

---

## 🚀 Quick Start

### 1. Install PlatformIO
```bash
# Install PlatformIO CLI
pip install platformio

# Or use VS Code extension
# https://platformio.org/install/ide?install=vscode
```

### 2. Configure Wi-Fi (Optional for Phase 1)
Edit `include/Config.h`:
```cpp
#define WIFI_SSID "YourNetworkName"
#define WIFI_PASSWORD "YourPassword"
```

### 3. Upload Firmware
```bash
cd esp32-gimbal-firmware

# Build
pio run

# Upload to ESP32
pio run --target upload

# Monitor serial output
pio device monitor
```

### 4. Expected Serial Output
```
==============================================
ESP32 Gimbal Control System - Phase 1
==============================================

[Setup] Initializing MPU6050 sensor...
[MPU6050] Sensor initialized successfully

[Setup] Calibrating sensor (keep gimbal stationary)...
[MPU6050] Starting calibration with 1000 samples...
  Progress: 0/1000
  Progress: 100/1000
  ...
[MPU6050] Calibration complete:
  Accel offsets: X=0.1234, Y=-0.0567, Z=0.0891 m/s^2
  Gyro offsets: X=0.0023, Y=-0.0015, Z=0.0007 rad/s

[Setup] Creating FreeRTOS tasks...
[Task:Sensor] Started on Core 0

[Setup] System initialization complete
==============================================

[Attitude] Pitch:  -2.34°  Roll:   1.45°  Yaw:   0.12°
[Attitude] Pitch:  -2.31°  Roll:   1.47°  Yaw:   0.15°
...
```

---

## 🔧 Configuration

All configuration is in `include/Config.h`:

### I2C Settings
```cpp
#define MPU6050_SDA_PIN 21
#define MPU6050_SCL_PIN 22
#define MPU6050_I2C_FREQ 400000  // 400 kHz
```

### Filter Settings
```cpp
#define COMPLEMENTARY_FILTER_ALPHA 0.96  // 0.0~1.0
// Higher = trust gyro more (responsive but drifts)
// Lower = trust accel more (stable but noisy)
```

### Task Settings
```cpp
#define SENSOR_READ_INTERVAL_MS 10       // 100 Hz
#define SENSOR_TASK_PRIORITY 4           // Highest priority
#define SENSOR_TASK_STACK_SIZE 8192      // 8 KB
```

---

## 🧪 Testing

### Test 1: Sensor Connection
- Upload firmware
- Check serial output
- Should see `[MPU6050] Sensor initialized successfully`

### Test 2: Calibration
- Keep gimbal **perfectly still and level**
- Wait for calibration to complete
- Offsets should be small (< 0.5 for accel, < 0.01 for gyro)

### Test 3: Attitude Estimation
- Tilt gimbal forward/back (pitch should change)
- Tilt gimbal left/right (roll should change)
- Rotate gimbal around Z-axis (yaw will drift - expected without magnetometer)

### Expected Performance
- **Pitch/Roll accuracy**: ±2° (stationary)
- **Update rate**: 100 Hz (10ms interval)
- **Latency**: < 15ms (I2C read + filter update)
- **Yaw drift**: ~5°/min (acceptable for Phase 1, will add magnetometer later)

---

## 📊 Phase 1 Completion Criteria

- [x] MPU6050 I2C communication working
- [x] Accelerometer reading (X, Y, Z)
- [x] Gyroscope reading (X, Y, Z)
- [x] Automatic calibration routine
- [x] Complementary filter implementation
- [x] FreeRTOS sensor task (100Hz)
- [x] Mutex-protected data sharing
- [x] Serial debug output

---

## 🛠️ Troubleshooting

### Problem: "Failed to find MPU6050 chip"
- **Check wiring**: SDA=GPIO21, SCL=GPIO22, VCC=3.3V, GND=GND
- **Check I2C address**: MPU6050 default is 0x68 (Adafruit library auto-detects)
- **Test with I2C scanner**: `examples/I2CScanner.ino`

### Problem: Calibration offsets are very large
- **Ensure gimbal is stationary** during calibration
- **Check sensor orientation**: Z-axis should point up (gravity = +9.8 m/s²)
- **Re-run calibration**: Reset ESP32 and try again

### Problem: Attitude angles are noisy
- **Reduce complementary filter alpha**: Try 0.92 instead of 0.96
- **Check for vibrations**: Sensor should be firmly mounted
- **Increase filter bandwidth**: `MPU6050_BAND_21_HZ` → `MPU6050_BAND_10_HZ`

### Problem: Yaw drifts rapidly
- **Expected behavior**: Yaw drifts without magnetometer (Phase 1 limitation)
- **Workaround**: Reset yaw to 0 periodically (button press)
- **Permanent fix**: Add magnetometer in Phase 4 (QMC5883L or HMC5883L)

---

## 🔜 Next Steps (Phase 2)

1. **PID Controller**
   - Implement PID class (`src/control/PIDController.cpp`)
   - Anti-windup protection
   - Tunable gains (Kp, Ki, Kd)

2. **Servo Control**
   - Initialize PWM channels (GPIO 12, 13)
   - Map PID output to servo angles
   - Servo smoothing/slew rate limiting

3. **Control Task**
   - Create FreeRTOS control task (Core 1, 50Hz)
   - Read attitude → PID → Servo output
   - Coordinate with sensor task via mutex

4. **Testing**
   - Manual PID tuning (serial commands)
   - Stabilization performance measurement
   - Servo response validation

---

## 📝 Notes

- **Coordinate System**: Right-hand rule (X=forward, Y=left, Z=up)
- **Angle Units**: Radians internally, degrees for serial output
- **Filter Alpha**: 0.96 means 96% gyro, 4% accel (good for gimbal)
- **Core Assignment**: Core 0 for I2C (avoids WiFi interference on Core 1)

---

## 📚 References

- [MPU6050 Datasheet](https://invensense.tdk.com/wp-content/uploads/2015/02/MPU-6000-Datasheet1.pdf)
- [Complementary Filter Explanation](https://www.pieter-jan.com/node/11)
- [PlatformIO ESP32 Docs](https://docs.platformio.org/en/latest/platforms/espressif32.html)
- [FreeRTOS Task Management](https://www.freertos.org/taskandcr.html)

---

**Next Phase**: [Phase 2 - PID Control & Servo Integration](../docs/GIMBAL_ROADMAP.md#phase-2)
