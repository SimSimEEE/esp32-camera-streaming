/**
 * `ServoController.cpp`
 * - Servo motor controller implementation using ESP32 LEDC
 *
 * @author      Sim U Geun <sim@lemoncloud.io>
 * @date        2025-02-03 initial version
 *
 * @copyright   (C) 2025 LemonCloud Co Ltd. - All Rights Reserved.
 */
#include "ServoController.h"

/**
 * Constructor - initialize member variables
 */
ServoController::ServoController()
    : pitchPin_(-1)
    , rollPin_(-1)
    , frequency_(50)
    , angleMin_(-90.0f)
    , angleMax_(90.0f)
    , pulseMinUs_(500)
    , pulseMaxUs_(2500)
    , currentPitchAngle_(0.0f)
    , currentRollAngle_(0.0f)
    , initialized_(false)
{
}

/**
 * Destructor
 */
ServoController::~ServoController() {
    detach();
}

/**
 * Initialize servo motors with LEDC peripheral
 * 
 * ESP32 LEDC (LED Control) peripheral can generate precise PWM signals:
 * - 16 channels (0-15)
 * - Configurable frequency (typically 50Hz for servos)
 * - 16-bit resolution (0-65535)
 */
bool ServoController::begin(int pitchPin, int rollPin, int frequency) {
    pitchPin_ = pitchPin;
    rollPin_ = rollPin;
    frequency_ = frequency;
    
    Serial.printf("[Servo] Initializing on pins: Pitch=%d, Roll=%d, Freq=%dHz\n",
        pitchPin_, rollPin_, frequency_);
    
    // Configure LEDC timer
    // Timer 0, 16-bit resolution, frequency Hz
    ledcSetup(PITCH_CHANNEL, frequency_, PWM_RESOLUTION);
    ledcSetup(ROLL_CHANNEL, frequency_, PWM_RESOLUTION);
    
    // Attach pins to LEDC channels
    ledcAttachPin(pitchPin_, PITCH_CHANNEL);
    ledcAttachPin(rollPin_, ROLL_CHANNEL);
    
    // Center both servos
    center();
    
    initialized_ = true;
    Serial.println("[Servo] Initialization complete");
    
    return true;
}

/**
 * Set pitch angle
 */
float ServoController::setPitchAngle(float angle) {
    if (!initialized_) {
        Serial.println("[Servo] ERROR: Not initialized");
        return currentPitchAngle_;
    }
    
    // Clamp to valid range
    angle = clampAngle(angle);
    
    // Convert to PWM duty cycle
    uint32_t duty = angleToDuty(angle);
    
    // Write PWM
    writePWM(PITCH_CHANNEL, duty);
    
    // Update state
    currentPitchAngle_ = angle;
    
    return angle;
}

/**
 * Set roll angle
 */
float ServoController::setRollAngle(float angle) {
    if (!initialized_) {
        Serial.println("[Servo] ERROR: Not initialized");
        return currentRollAngle_;
    }
    
    // Clamp to valid range
    angle = clampAngle(angle);
    
    // Convert to PWM duty cycle
    uint32_t duty = angleToDuty(angle);
    
    // Write PWM
    writePWM(ROLL_CHANNEL, duty);
    
    // Update state
    currentRollAngle_ = angle;
    
    return angle;
}

/**
 * Set both angles simultaneously
 */
void ServoController::setAngles(float pitchAngle, float rollAngle) {
    setPitchAngle(pitchAngle);
    setRollAngle(rollAngle);
}

/**
 * Get current pitch angle
 */
float ServoController::getPitchAngle() const {
    return currentPitchAngle_;
}

/**
 * Get current roll angle
 */
float ServoController::getRollAngle() const {
    return currentRollAngle_;
}

/**
 * Set angle limits
 */
void ServoController::setAngleLimits(float min, float max) {
    angleMin_ = min;
    angleMax_ = max;
    
    Serial.printf("[Servo] Angle limits: [%.1f, %.1f] degrees\n", min, max);
}

/**
 * Set pulse width range
 */
void ServoController::setPulseRange(int minUs, int maxUs) {
    pulseMinUs_ = minUs;
    pulseMaxUs_ = maxUs;
    
    Serial.printf("[Servo] Pulse range: [%d, %d] microseconds\n", minUs, maxUs);
}

/**
 * Center both servos (0°)
 */
void ServoController::center() {
    setPitchAngle(0.0f);
    setRollAngle(0.0f);
    
    Serial.println("[Servo] Centered");
}

/**
 * Detach servos (stop PWM)
 */
void ServoController::detach() {
    if (initialized_) {
        ledcDetachPin(pitchPin_);
        ledcDetachPin(rollPin_);
        
        initialized_ = false;
        Serial.println("[Servo] Detached");
    }
}

/**
 * Convert angle to PWM duty cycle
 * 
 * Conversion formula:
 * 1. Normalize angle: -90° ~ +90° → 0.0 ~ 1.0
 * 2. Map to pulse width: 0.0 ~ 1.0 → 500us ~ 2500us
 * 3. Calculate duty cycle: (pulseUs / periodUs) * maxDuty
 * 
 * Example (50Hz, 16-bit):
 * - Period = 1/50Hz = 20ms = 20000us
 * - Max duty = 2^16 - 1 = 65535
 * - 0° → 1500us → (1500/20000)*65535 = 4915
 */
uint32_t ServoController::angleToDuty(float angle) const {
    // Normalize angle to [0.0, 1.0]
    float normalized = (angle - angleMin_) / (angleMax_ - angleMin_);
    
    // Map to pulse width (microseconds)
    float pulseUs = pulseMinUs_ + normalized * (pulseMaxUs_ - pulseMinUs_);
    
    // Calculate period (microseconds)
    float periodUs = 1000000.0f / frequency_;  // 50Hz → 20000us
    
    // Calculate duty cycle (16-bit: 0 ~ 65535)
    uint32_t maxDuty = (1 << PWM_RESOLUTION) - 1;  // 2^16 - 1 = 65535
    uint32_t duty = (uint32_t)((pulseUs / periodUs) * maxDuty);
    
    return duty;
}

/**
 * Clamp angle to valid range
 */
float ServoController::clampAngle(float angle) const {
    if (angle < angleMin_) return angleMin_;
    if (angle > angleMax_) return angleMax_;
    return angle;
}

/**
 * Write PWM to servo channel
 */
void ServoController::writePWM(int channel, uint32_t duty) {
    ledcWrite(channel, duty);
}
