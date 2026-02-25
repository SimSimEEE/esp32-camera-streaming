/**
 * `ServoController.h`
 * - Servo motor controller using ESP32 LEDC (PWM)
 * - Supports 2 servos (pitch, roll) with angle-to-PWM conversion
 *
 * @author      Sim U Geun <sim@lemoncloud.io>
 * @date        2025-02-03 initial version
 *
 * @copyright   (C) 2025 LemonCloud Co Ltd. - All Rights Reserved.
 */
#pragma once

#include <Arduino.h>

/**
 * Servo motor controller class
 * - Uses ESP32 LEDC peripheral for precise PWM generation
 * - Supports standard servo motors (500us ~ 2500us pulse width)
 * - Angle range: -90° ~ +90° (configurable)
 */
class ServoController {
public:
    /**
     * Constructor
     */
    ServoController();
    
    /**
     * Destructor
     */
    ~ServoController();
    
    /**
     * Initialize servo motors
     * @param pitchPin GPIO pin for pitch servo
     * @param rollPin GPIO pin for roll servo
     * @param frequency PWM frequency (default: 50Hz)
     * @return true if successful
     */
    bool begin(int pitchPin, int rollPin, int frequency = 50);
    
    /**
     * Set pitch angle
     * @param angle Angle in degrees (-90 ~ +90)
     * @return Actual angle applied (after clamping)
     */
    float setPitchAngle(float angle);
    
    /**
     * Set roll angle
     * @param angle Angle in degrees (-90 ~ +90)
     * @return Actual angle applied (after clamping)
     */
    float setRollAngle(float angle);
    
    /**
     * Set both angles simultaneously
     * @param pitchAngle Pitch angle in degrees
     * @param rollAngle Roll angle in degrees
     */
    void setAngles(float pitchAngle, float rollAngle);
    
    /**
     * Get current pitch angle
     * @return Current pitch angle in degrees
     */
    float getPitchAngle() const;
    
    /**
     * Get current roll angle
     * @return Current roll angle in degrees
     */
    float getRollAngle() const;
    
    /**
     * Set angle limits
     * @param min Minimum angle (default: -90°)
     * @param max Maximum angle (default: +90°)
     */
    void setAngleLimits(float min, float max);
    
    /**
     * Set pulse width range (microseconds)
     * @param minUs Minimum pulse width (default: 500us)
     * @param maxUs Maximum pulse width (default: 2500us)
     */
    void setPulseRange(int minUs, int maxUs);
    
    /**
     * Center both servos (0°)
     */
    void center();
    
    /**
     * Detach servos (stop PWM signals)
     */
    void detach();

private:
    // LEDC channels (ESP32 has 16 channels)
    static const int PITCH_CHANNEL = 0;
    static const int ROLL_CHANNEL = 1;
    
    // PWM resolution (bits)
    static const int PWM_RESOLUTION = 16;  // 16-bit resolution
    
    // GPIO pins
    int pitchPin_;
    int rollPin_;
    
    // PWM frequency
    int frequency_;
    
    // Angle limits
    float angleMin_;
    float angleMax_;
    
    // Pulse width limits (microseconds)
    int pulseMinUs_;
    int pulseMaxUs_;
    
    // Current angles
    float currentPitchAngle_;
    float currentRollAngle_;
    
    // Initialization flag
    bool initialized_;
    
    /**
     * Convert angle to PWM duty cycle
     * @param angle Angle in degrees (-90 ~ +90)
     * @return PWM duty cycle (0 ~ 2^PWM_RESOLUTION - 1)
     */
    uint32_t angleToDuty(float angle) const;
    
    /**
     * Clamp angle to valid range
     * @param angle Angle in degrees
     * @return Clamped angle
     */
    float clampAngle(float angle) const;
    
    /**
     * Write PWM to servo channel
     * @param channel LEDC channel
     * @param duty PWM duty cycle
     */
    void writePWM(int channel, uint32_t duty);
};
