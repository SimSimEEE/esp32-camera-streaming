/**
 * `PIDController.h`
 * - PID controller for precise gimbal stabilization
 * - Features: Anti-windup, output clamping, derivative filtering
 *
 * @author      Sim U Geun <sim@lemoncloud.io>
 * @date        2025-02-03 initial version
 *
 * @copyright   (C) 2025 LemonCloud Co Ltd. - All Rights Reserved.
 */
#pragma once

/**
 * PID Controller for single axis
 * - Proportional: Kp * error
 * - Integral: Ki * sum(error * dt) with anti-windup
 * - Derivative: Kd * (error - prev_error) / dt with filtering
 */
class PIDController {
public:
    /**
     * Constructor
     * @param kp Proportional gain
     * @param ki Integral gain
     * @param kd Derivative gain
     * @param outputMin Minimum output value
     * @param outputMax Maximum output value
     */
    PIDController(float kp = 1.0f, float ki = 0.0f, float kd = 0.0f,
                  float outputMin = -90.0f, float outputMax = 90.0f);
    
    /**
     * Destructor
     */
    ~PIDController();
    
    /**
     * Compute PID output
     * @param setpoint Target value (degrees)
     * @param measurement Current value (degrees)
     * @param dt Time delta since last update (seconds)
     * @return Control output (degrees)
     */
    float compute(float setpoint, float measurement, float dt);
    
    /**
     * Reset PID state (clear integral, previous error)
     */
    void reset();
    
    /**
     * Set PID gains
     * @param kp Proportional gain
     * @param ki Integral gain
     * @param kd Derivative gain
     */
    void setGains(float kp, float ki, float kd);
    
    /**
     * Get current PID gains
     * @param kp Output: Proportional gain
     * @param ki Output: Integral gain
     * @param kd Output: Derivative gain
     */
    void getGains(float& kp, float& ki, float& kd) const;
    
    /**
     * Set output limits
     * @param min Minimum output
     * @param max Maximum output
     */
    void setOutputLimits(float min, float max);
    
    /**
     * Set integral limits (anti-windup)
     * @param min Minimum integral value
     * @param max Maximum integral value
     */
    void setIntegralLimits(float min, float max);
    
    /**
     * Get last computed values (for debugging)
     * @param pTerm Output: Proportional term
     * @param iTerm Output: Integral term
     * @param dTerm Output: Derivative term
     */
    void getTerms(float& pTerm, float& iTerm, float& dTerm) const;
    
    /**
     * Get last output
     * @return Last computed output
     */
    float getOutput() const;

private:
    // PID gains
    float kp_;
    float ki_;
    float kd_;
    
    // Output limits
    float outputMin_;
    float outputMax_;
    
    // Integral limits (anti-windup)
    float integralMin_;
    float integralMax_;
    
    // State variables
    float integral_;
    float previousError_;
    float previousDerivative_;  // For derivative filtering
    
    // Last computed values
    float lastPTerm_;
    float lastITerm_;
    float lastDTerm_;
    float lastOutput_;
    
    // First run flag
    bool firstRun_;
    
    /**
     * Clamp value to [min, max]
     * @param value Value to clamp
     * @param min Minimum
     * @param max Maximum
     * @return Clamped value
     */
    float clamp(float value, float min, float max) const;
};
