/**
 * `LedModule.cpp`
 * - ESP32-CAM LED module implementation
 *
 * @author      Sim Si-Geun <sim@granule.io>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

#include "LedModule.h"

// ========================================
// Constructor
// ========================================
LedModule::LedModule() : _state(false) {
}

// ========================================
// Initialize LED
// ========================================
void LedModule::init() {
    pinMode(LED_GPIO_NUM, OUTPUT);
    off(); // Start with LED off
    Serial.println("[LED] Initialized on GPIO 4");
}

// ========================================
// Turn LED On
// ========================================
void LedModule::on() {
    digitalWrite(LED_GPIO_NUM, HIGH);
    _state = true;
    Serial.println("[LED] Turned ON");
}

// ========================================
// Turn LED Off
// ========================================
void LedModule::off() {
    digitalWrite(LED_GPIO_NUM, LOW);
    _state = false;
    Serial.println("[LED] Turned OFF");
}

// ========================================
// Toggle LED
// ========================================
void LedModule::toggle() {
    if (_state) {
        off();
    } else {
        on();
    }
}

// ========================================
// Set LED State
// ========================================
void LedModule::setState(bool state) {
    if (state) {
        on();
    } else {
        off();
    }
}

// ========================================
// Get Status String
// ========================================
String LedModule::getStatusString() const {
    return _state ? "LED_STATUS:ON" : "LED_STATUS:OFF";
}
