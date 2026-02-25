/**
 * `PIDController.cpp`
 * - PID controller implementation with anti-windup and derivative filtering
 *
 * @author      Sim U Geun <sim@lemoncloud.io>
 * @date        2025-02-03 initial version
 *
 * @copyright   (C) 2025 LemonCloud Co Ltd. - All Rights Reserved.
 */
#include "PIDController.h"
#include <Arduino.h>

/**
 * Constructor - initialize PID with gains and output limits
 */
PIDController::PIDController(float kp, float ki, float kd,
                             float outputMin, float outputMax)
    : kp_(kp)
    , ki_(ki)
    , kd_(kd)
    , outputMin_(outputMin)
    , outputMax_(outputMax)
    , integralMin_(-10.0f)
    , integralMax_(10.0f)
    , integral_(0.0f)
    , previousError_(0.0f)
    , previousDerivative_(0.0f)
    , lastPTerm_(0.0f)
    , lastITerm_(0.0f)
    , lastDTerm_(0.0f)
    , lastOutput_(0.0f)
    , firstRun_(true)
{
    Serial.printf("[PID] Initialized: Kp=%.3f, Ki=%.3f, Kd=%.3f\n", kp_, ki_, kd_);
}

/**
 * Destructor
 */
PIDController::~PIDController() {
    // Nothing to clean up
}

/**
 * Compute PID output
 * 
 * PID Formula:
 *   output = Kp * error + Ki * integral(error) + Kd * d(error)/dt
 * 
 * Features:
 * 1. Anti-windup: Integral clamping to prevent saturation
 * 2. Derivative filtering: Low-pass filter to reduce noise
 * 3. Output clamping: Limit to valid servo range
 */
float PIDController::compute(float setpoint, float measurement, float dt) {
    // Calculate error
    float error = setpoint - measurement;
    
    // Proportional term
    lastPTerm_ = kp_ * error;
    
    // Integral term with anti-windup
    if (ki_ > 0.0f) {
        integral_ += error * dt;
        // Clamp integral to prevent windup
        integral_ = clamp(integral_, integralMin_, integralMax_);
        lastITerm_ = ki_ * integral_;
    } else {
        integral_ = 0.0f;
        lastITerm_ = 0.0f;
    }
    
    // Derivative term with filtering (alpha = 0.8)
    if (kd_ > 0.0f && !firstRun_) {
        float derivative = (error - previousError_) / dt;
        
        // Low-pass filter to reduce noise
        float filteredDerivative = 0.8f * previousDerivative_ + 0.2f * derivative;
        previousDerivative_ = filteredDerivative;
        
        lastDTerm_ = kd_ * filteredDerivative;
    } else {
        lastDTerm_ = 0.0f;
        previousDerivative_ = 0.0f;
    }
    
    // Sum all terms
    float output = lastPTerm_ + lastITerm_ + lastDTerm_;
    
    // Clamp output to valid range
    lastOutput_ = clamp(output, outputMin_, outputMax_);
    
    // Update state
    previousError_ = error;
    firstRun_ = false;
    
    return lastOutput_;
}

/**
 * Reset PID state (useful when setpoint changes drastically)
 */
void PIDController::reset() {
    integral_ = 0.0f;
    previousError_ = 0.0f;
    previousDerivative_ = 0.0f;
    lastPTerm_ = 0.0f;
    lastITerm_ = 0.0f;
    lastDTerm_ = 0.0f;
    lastOutput_ = 0.0f;
    firstRun_ = true;
    
    Serial.println("[PID] Reset");
}

/**
 * Set PID gains (runtime tuning)
 */
void PIDController::setGains(float kp, float ki, float kd) {
    kp_ = kp;
    ki_ = ki;
    kd_ = kd;
    
    Serial.printf("[PID] Gains updated: Kp=%.3f, Ki=%.3f, Kd=%.3f\n", kp_, ki_, kd_);
}

/**
 * Get current PID gains
 */
void PIDController::getGains(float& kp, float& ki, float& kd) const {
    kp = kp_;
    ki = ki_;
    kd = kd_;
}

/**
 * Set output limits (servo range)
 */
void PIDController::setOutputLimits(float min, float max) {
    outputMin_ = min;
    outputMax_ = max;
    
    Serial.printf("[PID] Output limits: [%.1f, %.1f]\n", min, max);
}

/**
 * Set integral limits (anti-windup)
 */
void PIDController::setIntegralLimits(float min, float max) {
    integralMin_ = min;
    integralMax_ = max;
    
    Serial.printf("[PID] Integral limits: [%.1f, %.1f]\n", min, max);
}

/**
 * Get last computed PID terms (for debugging)
 */
void PIDController::getTerms(float& pTerm, float& iTerm, float& dTerm) const {
    pTerm = lastPTerm_;
    iTerm = lastITerm_;
    dTerm = lastDTerm_;
}

/**
 * Get last output
 */
float PIDController::getOutput() const {
    return lastOutput_;
}

/**
 * Clamp value to [min, max]
 */
float PIDController::clamp(float value, float min, float max) const {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}
