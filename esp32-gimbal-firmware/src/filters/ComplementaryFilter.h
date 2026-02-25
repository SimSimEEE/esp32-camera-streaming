/**
 * `ComplementaryFilter.h`
 * - Complementary filter for sensor fusion
 * - Combines gyroscope integration with accelerometer data
 *
 * @author      Sim U Geun <sim@lemoncloud.io>
 * @date        2025-02-03 initial version
 *
 * @copyright   (C) 2025 LemonCloud Co Ltd. - All Rights Reserved.
 */
#pragma once

/**
 * Attitude angles structure (in radians)
 */
struct Attitude {
    float pitch;  // Rotation around Y-axis (rad)
    float roll;   // Rotation around X-axis (rad)
    float yaw;    // Rotation around Z-axis (rad) - drift-prone without magnetometer
    unsigned long timestamp;
};

/**
 * Complementary filter class
 * - Fuses gyroscope (high-frequency, drifts) with accelerometer (low-frequency, no drift)
 * - Formula: angle = alpha * (angle + gyro * dt) + (1 - alpha) * accel_angle
 */
class ComplementaryFilter {
public:
    /**
     * Constructor
     * @param alpha Filter coefficient (0.0 ~ 1.0, default: 0.96)
     *              Higher alpha = trust gyro more (responsive but drifts)
     *              Lower alpha = trust accel more (stable but noisy)
     */
    ComplementaryFilter(float alpha = 0.96);
    
    /**
     * Destructor
     */
    ~ComplementaryFilter();
    
    /**
     * Update filter with new sensor data
     * @param gyroX Gyroscope X (rad/s)
     * @param gyroY Gyroscope Y (rad/s)
     * @param gyroZ Gyroscope Z (rad/s)
     * @param accelX Accelerometer X (m/s^2)
     * @param accelY Accelerometer Y (m/s^2)
     * @param accelZ Accelerometer Z (m/s^2)
     * @param dt Time delta since last update (seconds)
     * @return Updated attitude
     */
    const Attitude& update(
        float gyroX, float gyroY, float gyroZ,
        float accelX, float accelY, float accelZ,
        float dt
    );
    
    /**
     * Get current attitude
     * @return Current attitude angles
     */
    const Attitude& getAttitude() const;
    
    /**
     * Reset filter to zero angles
     */
    void reset();
    
    /**
     * Set filter coefficient
     * @param alpha Filter coefficient (0.0 ~ 1.0)
     */
    void setAlpha(float alpha);
    
    /**
     * Get filter coefficient
     * @return Current alpha value
     */
    float getAlpha() const;

private:
    float alpha_;
    Attitude attitude_;
    
    /**
     * Calculate pitch and roll from accelerometer data
     * @param accelX Accelerometer X (m/s^2)
     * @param accelY Accelerometer Y (m/s^2)
     * @param accelZ Accelerometer Z (m/s^2)
     * @param pitch Output pitch angle (rad)
     * @param roll Output roll angle (rad)
     */
    void calculateAccelAngles(
        float accelX, float accelY, float accelZ,
        float& pitch, float& roll
    );
    
    /**
     * Constrain angle to [-PI, PI]
     * @param angle Angle in radians
     * @return Constrained angle
     */
    float constrainAngle(float angle);
};
