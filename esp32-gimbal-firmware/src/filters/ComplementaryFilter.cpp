/**
 * `ComplementaryFilter.cpp`
 * - Complementary filter implementation
 * - Gyro integration + accelerometer fusion
 *
 * @author      Sim U Geun <sim@lemoncloud.io>
 * @date        2025-02-03 initial version
 *
 * @copyright   (C) 2025 LemonCloud Co Ltd. - All Rights Reserved.
 */
#include "ComplementaryFilter.h"
#include <Arduino.h>
#include <math.h>

/**
 * Constructor - initialize with alpha coefficient
 */
ComplementaryFilter::ComplementaryFilter(float alpha) 
    : alpha_(alpha) {
    reset();
}

/**
 * Destructor
 */
ComplementaryFilter::~ComplementaryFilter() {
    // Nothing to clean up
}

/**
 * Update filter with new sensor data
 * This is the core complementary filter algorithm:
 * 1. Integrate gyroscope to get angle change
 * 2. Calculate angle from accelerometer
 * 3. Fuse: angle = alpha * (angle + gyro*dt) + (1-alpha) * accel_angle
 */
const Attitude& ComplementaryFilter::update(
    float gyroX, float gyroY, float gyroZ,
    float accelX, float accelY, float accelZ,
    float dt
) {
    // Step 1: Integrate gyroscope (high-frequency tracking)
    // Note: Gyro measures angular velocity, so integrate to get angle change
    float gyroPitch = gyroX * dt;  // Change in pitch (rad)
    float gyroRoll = gyroY * dt;   // Change in roll (rad)
    float gyroYaw = gyroZ * dt;    // Change in yaw (rad)
    
    // Step 2: Calculate angles from accelerometer (low-frequency correction)
    float accelPitch, accelRoll;
    calculateAccelAngles(accelX, accelY, accelZ, accelPitch, accelRoll);
    
    // Step 3: Complementary filter fusion
    // Trust gyro for short-term changes, accel for long-term stability
    attitude_.pitch = alpha_ * (attitude_.pitch + gyroPitch) + (1.0f - alpha_) * accelPitch;
    attitude_.roll = alpha_ * (attitude_.roll + gyroRoll) + (1.0f - alpha_) * accelRoll;
    
    // Yaw: No accelerometer reference, so pure gyro integration (will drift)
    // TODO: Add magnetometer for yaw drift correction
    attitude_.yaw += gyroYaw;
    
    // Constrain angles to [-PI, PI]
    attitude_.pitch = constrainAngle(attitude_.pitch);
    attitude_.roll = constrainAngle(attitude_.roll);
    attitude_.yaw = constrainAngle(attitude_.yaw);
    
    // Update timestamp
    attitude_.timestamp = millis();
    
    return attitude_;
}

/**
 * Get current attitude
 */
const Attitude& ComplementaryFilter::getAttitude() const {
    return attitude_;
}

/**
 * Reset filter to zero angles
 */
void ComplementaryFilter::reset() {
    attitude_.pitch = 0;
    attitude_.roll = 0;
    attitude_.yaw = 0;
    attitude_.timestamp = millis();
}

/**
 * Set filter coefficient
 */
void ComplementaryFilter::setAlpha(float alpha) {
    // Clamp to valid range [0.0, 1.0]
    if (alpha < 0.0f) alpha = 0.0f;
    if (alpha > 1.0f) alpha = 1.0f;
    
    alpha_ = alpha;
    Serial.printf("[Filter] Alpha set to %.3f\n", alpha_);
}

/**
 * Get filter coefficient
 */
float ComplementaryFilter::getAlpha() const {
    return alpha_;
}

/**
 * Calculate pitch and roll from accelerometer data
 * 
 * Theory:
 * - When stationary, accelerometer measures gravity vector
 * - Pitch = atan2(-accelX, sqrt(accelY^2 + accelZ^2))
 * - Roll = atan2(accelY, accelZ)
 * 
 * Coordinate system (typical MPU6050 orientation):
 * - X: forward, Y: left, Z: up
 * - Pitch: nose up/down (rotation around Y)
 * - Roll: left/right tilt (rotation around X)
 */
void ComplementaryFilter::calculateAccelAngles(
    float accelX, float accelY, float accelZ,
    float& pitch, float& roll
) {
    // Calculate pitch (rotation around Y-axis)
    // When tilting forward, accelX becomes negative
    pitch = atan2(-accelX, sqrt(accelY * accelY + accelZ * accelZ));
    
    // Calculate roll (rotation around X-axis)
    // When tilting left, accelY becomes positive
    roll = atan2(accelY, accelZ);
}

/**
 * Constrain angle to [-PI, PI] range
 */
float ComplementaryFilter::constrainAngle(float angle) {
    while (angle > PI) angle -= 2.0f * PI;
    while (angle < -PI) angle += 2.0f * PI;
    return angle;
}
