/**
 * `MPU6050Sensor.cpp`
 * - MPU6050 sensor driver implementation
 * - I2C communication, data reading, calibration logic
 *
 * @author      Sim U Geun <sim@lemoncloud.io>
 * @date        2025-02-03 initial version
 *
 * @copyright   (C) 2025 LemonCloud Co Ltd. - All Rights Reserved.
 */
#include "MPU6050Sensor.h"
#include <Arduino.h>

/**
 * Constructor - initialize member variables
 */
MPU6050Sensor::MPU6050Sensor() 
    : initialized_(false) {
    resetCalibration();
    memset(lastError_, 0, sizeof(lastError_));
}

/**
 * Destructor
 */
MPU6050Sensor::~MPU6050Sensor() {
    // Nothing to clean up
}

/**
 * Initialize MPU6050 sensor with I2C pins
 */
bool MPU6050Sensor::begin(int sdaPin, int sclPin, uint32_t frequency) {
    // Initialize I2C bus
    Wire.begin(sdaPin, sclPin);
    Wire.setClock(frequency);
    
    // Try to initialize MPU6050
    if (!mpu_.begin()) {
        setLastError("Failed to find MPU6050 chip");
        return false;
    }
    
    // Configure default settings
    // Accelerometer range: ±4G (good balance for gimbal)
    mpu_.setAccelerometerRange(MPU6050_RANGE_4_G);
    
    // Gyroscope range: ±500 deg/s (gimbal typically < 180 deg/s)
    mpu_.setGyroRange(MPU6050_RANGE_500_DEG);
    
    // Filter bandwidth: 21 Hz (balance noise reduction & latency)
    mpu_.setFilterBandwidth(MPU6050_BAND_21_HZ);
    
    initialized_ = true;
    Serial.println("[MPU6050] Sensor initialized successfully");
    return true;
}

/**
 * Check if sensor is available
 */
bool MPU6050Sensor::isAvailable() {
    return initialized_;
}

/**
 * Read raw sensor data without calibration
 */
bool MPU6050Sensor::readRawData(SensorData& data) {
    if (!initialized_) {
        setLastError("Sensor not initialized");
        return false;
    }
    
    sensors_event_t accel, gyro, temp;
    
    if (!mpu_.getEvent(&accel, &gyro, &temp)) {
        setLastError("Failed to read sensor events");
        return false;
    }
    
    // Store raw data
    data.accelX = accel.acceleration.x;
    data.accelY = accel.acceleration.y;
    data.accelZ = accel.acceleration.z;
    
    data.gyroX = gyro.gyro.x;
    data.gyroY = gyro.gyro.y;
    data.gyroZ = gyro.gyro.z;
    
    data.temperature = temp.temperature;
    data.timestamp = millis();
    
    return true;
}

/**
 * Read calibrated sensor data (apply offsets)
 */
bool MPU6050Sensor::readCalibratedData(SensorData& data) {
    if (!readRawData(data)) {
        return false;
    }
    
    // Apply calibration offsets if available
    if (calibration_.isCalibrated) {
        data.accelX -= calibration_.accelOffsetX;
        data.accelY -= calibration_.accelOffsetY;
        data.accelZ -= calibration_.accelOffsetZ;
        
        data.gyroX -= calibration_.gyroOffsetX;
        data.gyroY -= calibration_.gyroOffsetY;
        data.gyroZ -= calibration_.gyroOffsetZ;
    }
    
    return true;
}

/**
 * Calibrate sensor by averaging multiple samples
 * NOTE: Gimbal MUST be stationary and level during calibration
 */
bool MPU6050Sensor::calibrate(int samples) {
    if (!initialized_) {
        setLastError("Sensor not initialized");
        return false;
    }
    
    Serial.printf("[MPU6050] Starting calibration with %d samples...\n", samples);
    
    // Accumulators for averaging
    float accelXSum = 0, accelYSum = 0, accelZSum = 0;
    float gyroXSum = 0, gyroYSum = 0, gyroZSum = 0;
    int validSamples = 0;
    
    // Collect samples
    for (int i = 0; i < samples; i++) {
        SensorData data;
        
        if (readRawData(data)) {
            accelXSum += data.accelX;
            accelYSum += data.accelY;
            accelZSum += data.accelZ;
            
            gyroXSum += data.gyroX;
            gyroYSum += data.gyroY;
            gyroZSum += data.gyroZ;
            
            validSamples++;
        }
        
        // Small delay between samples
        delay(5);
        
        // Progress indicator
        if (i % 100 == 0) {
            Serial.printf("  Progress: %d/%d\n", i, samples);
        }
    }
    
    if (validSamples < samples / 2) {
        setLastError("Too many failed samples during calibration");
        return false;
    }
    
    // Calculate average offsets
    calibration_.accelOffsetX = accelXSum / validSamples;
    calibration_.accelOffsetY = accelYSum / validSamples;
    // Z-axis should be ~9.8 m/s^2 (gravity), so offset is (measured - 9.8)
    calibration_.accelOffsetZ = (accelZSum / validSamples) - 9.81;
    
    calibration_.gyroOffsetX = gyroXSum / validSamples;
    calibration_.gyroOffsetY = gyroYSum / validSamples;
    calibration_.gyroOffsetZ = gyroZSum / validSamples;
    
    calibration_.isCalibrated = true;
    
    Serial.println("[MPU6050] Calibration complete:");
    Serial.printf("  Accel offsets: X=%.4f, Y=%.4f, Z=%.4f m/s^2\n",
        calibration_.accelOffsetX, calibration_.accelOffsetY, calibration_.accelOffsetZ);
    Serial.printf("  Gyro offsets: X=%.4f, Y=%.4f, Z=%.4f rad/s\n",
        calibration_.gyroOffsetX, calibration_.gyroOffsetY, calibration_.gyroOffsetZ);
    
    return true;
}

/**
 * Get current calibration data
 */
const CalibrationData& MPU6050Sensor::getCalibration() const {
    return calibration_;
}

/**
 * Set calibration data (e.g., loaded from EEPROM)
 */
void MPU6050Sensor::setCalibration(const CalibrationData& calibration) {
    calibration_ = calibration;
    Serial.println("[MPU6050] Calibration data applied");
}

/**
 * Reset calibration to defaults
 */
void MPU6050Sensor::resetCalibration() {
    calibration_.accelOffsetX = 0;
    calibration_.accelOffsetY = 0;
    calibration_.accelOffsetZ = 0;
    calibration_.gyroOffsetX = 0;
    calibration_.gyroOffsetY = 0;
    calibration_.gyroOffsetZ = 0;
    calibration_.isCalibrated = false;
}

/**
 * Set accelerometer range
 */
void MPU6050Sensor::setAccelRange(mpu6050_accel_range_t range) {
    if (initialized_) {
        mpu_.setAccelerometerRange(range);
        Serial.printf("[MPU6050] Accelerometer range set to %d\n", range);
    }
}

/**
 * Set gyroscope range
 */
void MPU6050Sensor::setGyroRange(mpu6050_gyro_range_t range) {
    if (initialized_) {
        mpu_.setGyroRange(range);
        Serial.printf("[MPU6050] Gyroscope range set to %d\n", range);
    }
}

/**
 * Set filter bandwidth
 */
void MPU6050Sensor::setFilterBandwidth(mpu6050_bandwidth_t bandwidth) {
    if (initialized_) {
        mpu_.setFilterBandwidth(bandwidth);
        Serial.printf("[MPU6050] Filter bandwidth set to %d\n", bandwidth);
    }
}

/**
 * Get last error message
 */
const char* MPU6050Sensor::getLastError() const {
    return lastError_;
}

/**
 * Set last error message (internal helper)
 */
void MPU6050Sensor::setLastError(const char* error) {
    strncpy(lastError_, error, sizeof(lastError_) - 1);
    lastError_[sizeof(lastError_) - 1] = '\0';
    Serial.printf("[MPU6050] ERROR: %s\n", lastError_);
}
