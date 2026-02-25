/**
 * `MPU6050Sensor.h`
 * - MPU6050 6-axis IMU sensor driver for gimbal control
 * - Provides accelerometer and gyroscope data with calibration
 *
 * @author      Sim U Geun <sim@lemoncloud.io>
 * @date        2025-02-03 initial version
 *
 * @copyright   (C) 2025 LemonCloud Co Ltd. - All Rights Reserved.
 */
#pragma once

#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
#include <Wire.h>

/**
 * Raw sensor data structure
 */
struct SensorData {
    // Accelerometer (m/s^2)
    float accelX;
    float accelY;
    float accelZ;
    
    // Gyroscope (rad/s)
    float gyroX;
    float gyroY;
    float gyroZ;
    
    // Temperature (°C)
    float temperature;
    
    // Timestamp (ms)
    unsigned long timestamp;
};

/**
 * Calibration data structure
 */
struct CalibrationData {
    float accelOffsetX;
    float accelOffsetY;
    float accelOffsetZ;
    float gyroOffsetX;
    float gyroOffsetY;
    float gyroOffsetZ;
    bool isCalibrated;
};

/**
 * MPU6050 sensor driver class
 */
class MPU6050Sensor {
public:
    /**
     * Constructor
     */
    MPU6050Sensor();
    
    /**
     * Destructor
     */
    ~MPU6050Sensor();
    
    /**
     * Initialize MPU6050 sensor
     * @param sdaPin SDA pin number
     * @param sclPin SCL pin number
     * @param frequency I2C frequency (default: 400000 Hz)
     * @return true if successful
     */
    bool begin(int sdaPin, int sclPin, uint32_t frequency = 400000);
    
    /**
     * Check if sensor is connected and responding
     * @return true if sensor is available
     */
    bool isAvailable();
    
    /**
     * Read raw sensor data
     * @param data Output sensor data
     * @return true if successful
     */
    bool readRawData(SensorData& data);
    
    /**
     * Read calibrated sensor data
     * @param data Output sensor data (with offsets applied)
     * @return true if successful
     */
    bool readCalibratedData(SensorData& data);
    
    /**
     * Calibrate sensor (should be done when gimbal is stationary)
     * @param samples Number of samples to average (default: 1000)
     * @return true if successful
     */
    bool calibrate(int samples = 1000);
    
    /**
     * Get calibration data
     * @return Current calibration data
     */
    const CalibrationData& getCalibration() const;
    
    /**
     * Set calibration data (load from EEPROM/Flash)
     * @param calibration Calibration data to apply
     */
    void setCalibration(const CalibrationData& calibration);
    
    /**
     * Reset calibration data
     */
    void resetCalibration();
    
    /**
     * Set accelerometer range
     * @param range Range (2G, 4G, 8G, 16G)
     */
    void setAccelRange(mpu6050_accel_range_t range);
    
    /**
     * Set gyroscope range
     * @param range Range (250, 500, 1000, 2000 deg/s)
     */
    void setGyroRange(mpu6050_gyro_range_t range);
    
    /**
     * Set filter bandwidth
     * @param bandwidth Bandwidth (5, 10, 21, 44, 94, 184, 260 Hz)
     */
    void setFilterBandwidth(mpu6050_bandwidth_t bandwidth);
    
    /**
     * Get last error message
     * @return Error message string
     */
    const char* getLastError() const;

private:
    Adafruit_MPU6050 mpu_;
    CalibrationData calibration_;
    char lastError_[128];
    bool initialized_;
    
    /**
     * Set last error message
     * @param error Error message
     */
    void setLastError(const char* error);
};
