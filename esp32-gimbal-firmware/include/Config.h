/**
 * `Config.h`
 * - ESP32 Gimbal System Configuration
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-25 initial version
 *
 * @copyright   (C) 2026 SimSimEEE - All Rights Reserved.
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================================================
// Wi-Fi Configuration
// ============================================================================
#define WIFI_SSID           "YOUR_WIFI_SSID"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"
#define WIFI_CONNECT_TIMEOUT 10000  // 10 seconds

// ============================================================================
// WebSocket Server Configuration
// ============================================================================
#define WS_HOST             "192.168.1.100"  // Change to your server IP
#define WS_PORT             8887
#define WS_ENDPOINT         "/esp32"
#define WS_RECONNECT_INTERVAL 5000  // 5 seconds

// ============================================================================
// MPU6050 Sensor Configuration
// ============================================================================
#define MPU6050_I2C_SDA     21
#define MPU6050_I2C_SCL     22
#define MPU6050_I2C_FREQ    400000  // 400kHz Fast Mode

// Calibration offsets (update after calibration)
#define GYRO_X_OFFSET       0.0f
#define GYRO_Y_OFFSET       0.0f
#define GYRO_Z_OFFSET       0.0f
#define ACCEL_X_OFFSET      0.0f
#define ACCEL_Y_OFFSET      0.0f
#define ACCEL_Z_OFFSET      0.0f

// ============================================================================
// Servo Motor Configuration
// ============================================================================
#define SERVO_PITCH_PIN     12      // GPIO for pitch servo
#define SERVO_ROLL_PIN      13      // GPIO for roll servo
#define SERVO_PWM_FREQ      50      // 50Hz standard
#define SERVO_PWM_RESOLUTION 16     // 16-bit resolution

// Servo limits (in degrees)
#define SERVO_MIN_ANGLE     -90.0f
#define SERVO_MAX_ANGLE     90.0f
#define SERVO_MIN_PULSE_US  500     // 0.5ms
#define SERVO_MAX_PULSE_US  2500    // 2.5ms

// ============================================================================
// FreeRTOS Task Configuration
// ============================================================================
// Task priorities (0 = lowest, 25 = highest in ESP32)
#define TASK_PRIORITY_SENSOR    2
#define TASK_PRIORITY_CONTROL   4
#define TASK_PRIORITY_WEBSOCKET 1
#define TASK_PRIORITY_TELEMETRY 1

// Stack sizes (in bytes)
#define TASK_STACK_SENSOR       2048
#define TASK_STACK_CONTROL      3072
#define TASK_STACK_WEBSOCKET    8192
#define TASK_STACK_TELEMETRY    2048

// Task intervals (in milliseconds)
#define SENSOR_TASK_INTERVAL    10   // 100Hz
#define CONTROL_TASK_INTERVAL   20   // 50Hz
#define TELEMETRY_TASK_INTERVAL 100  // 10Hz

// ============================================================================
// Complementary Filter Configuration
// ============================================================================
#define COMP_FILTER_ALPHA   0.96f   // Gyro weight (0.96 = 96% gyro, 4% accel)

// ============================================================================
// PID Controller Configuration
// ============================================================================
// Initial PID gains (will be tuned)
#define PID_KP_PITCH        1.0f
#define PID_KI_PITCH        0.0f
#define PID_KD_PITCH        0.0f

#define PID_KP_ROLL         1.0f
#define PID_KI_ROLL         0.0f
#define PID_KD_ROLL         0.0f

// Anti-windup limits
#define PID_INTEGRAL_MIN    -10.0f
#define PID_INTEGRAL_MAX    10.0f

// ============================================================================
// Debug Configuration
// ============================================================================
#define DEBUG_SERIAL        true
#define DEBUG_SENSOR        false
#define DEBUG_CONTROL       false
#define DEBUG_WEBSOCKET     true

// ============================================================================
// System Configuration
// ============================================================================
#define SYSTEM_NAME         "ESP32-Gimbal"
#define FIRMWARE_VERSION    "1.0.0"
#define HEARTBEAT_INTERVAL  10000   // 10 seconds

#endif // CONFIG_H
