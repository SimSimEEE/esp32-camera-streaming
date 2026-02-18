/**
 * `LedModule.h`
 * - ESP32-CAM LED (Flash) control module
 * - Handles: LED initialization, on/off control, brightness
 *
 * @author      Sim Si-Geun <sim@granule.io>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

#ifndef LED_MODULE_H
#define LED_MODULE_H

#include <Arduino.h>

// ========================================
// LED Pin Configuration
// ========================================
#define LED_GPIO_NUM  4  // Built-in flash LED on GPIO 4

/**
 * LED Module Class
 * Manages LED/Flash control for ESP32-CAM
 */
class LedModule {
public:
    /**
     * Constructor
     */
    LedModule();

    /**
     * Initialize LED pin
     */
    void init();

    /**
     * Turn LED on
     */
    void on();

    /**
     * Turn LED off
     */
    void off();

    /**
     * Toggle LED state
     */
    void toggle();

    /**
     * Set LED state
     * @param state true = ON, false = OFF
     */
    void setState(bool state);

    /**
     * Get current LED state
     * @return true if LED is ON, false if OFF
     */
    bool getState() const { return _state; }

    /**
     * Get LED status as string
     * @return "LED_STATUS:ON" or "LED_STATUS:OFF"
     */
    String getStatusString() const;

private:
    bool _state;
};

#endif // LED_MODULE_H
