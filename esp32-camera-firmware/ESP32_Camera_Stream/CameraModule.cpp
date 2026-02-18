/**
 * `CameraModule.cpp`
 * - ESP32-CAM camera module implementation
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

#include "CameraModule.h"

// ========================================
// Constructor
// ========================================
CameraModule::CameraModule() : _initialized(false), _frameSize(FRAMESIZE_VGA) {
}

// ========================================
// Initialize Camera
// ========================================
bool CameraModule::init() {
    Serial.println("[Camera] Initializing camera...");
    
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;
    
    // Frame size and quality settings based on PSRAM availability
    if (psramFound()) {
        config.frame_size = FRAMESIZE_VGA;  // 640x480
        config.jpeg_quality = 10;           // 0-63, lower means higher quality
        config.fb_count = 2;                // Double buffering
        _frameSize = FRAMESIZE_VGA;
        Serial.println("[Camera] PSRAM found - using VGA quality");
    } else {
        config.frame_size = FRAMESIZE_SVGA; // 800x600
        config.jpeg_quality = 12;
        config.fb_count = 1;
        _frameSize = FRAMESIZE_SVGA;
        Serial.println("[Camera] PSRAM not found - using lower quality");
    }
    
    // Initialize camera
    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("[Camera] Init failed with error 0x%x\n", err);
        return false;
    }
    
    // Configure sensor settings
    configureSensor();
    
    _initialized = true;
    Serial.println("[Camera] Initialized successfully");
    return true;
}

// ========================================
// Configure Sensor Settings
// ========================================
void CameraModule::configureSensor() {
    sensor_t* s = esp_camera_sensor_get();
    if (s == NULL) {
        Serial.println("[Camera] WARNING: Could not get sensor");
        return;
    }
    
    // Adjust settings for better performance
    s->set_brightness(s, 0);     // -2 to 2
    s->set_contrast(s, 0);       // -2 to 2
    s->set_saturation(s, 0);     // -2 to 2
    s->set_special_effect(s, 0); // 0 to 6 (0 - No Effect)
    s->set_whitebal(s, 1);       // 0 = disable, 1 = enable
    s->set_awb_gain(s, 1);       // 0 = disable, 1 = enable
    s->set_wb_mode(s, 0);        // 0 to 4
    s->set_exposure_ctrl(s, 1);  // 0 = disable, 1 = enable
    s->set_aec2(s, 0);           // 0 = disable, 1 = enable
    s->set_gain_ctrl(s, 1);      // 0 = disable, 1 = enable
    s->set_agc_gain(s, 0);       // 0 to 30
    s->set_gainceiling(s, (gainceiling_t)0); // 0 to 6
    s->set_bpc(s, 0);            // 0 = disable, 1 = enable
    s->set_wpc(s, 1);            // 0 = disable, 1 = enable
    s->set_raw_gma(s, 1);        // 0 = disable, 1 = enable
    s->set_lenc(s, 1);           // 0 = disable, 1 = enable
    s->set_hmirror(s, 0);        // 0 = disable, 1 = enable
    s->set_vflip(s, 0);          // 0 = disable, 1 = enable
    s->set_dcw(s, 1);            // 0 = disable, 1 = enable
    s->set_colorbar(s, 0);       // 0 = disable, 1 = enable
    
    Serial.println("[Camera] Sensor configured");
}

// ========================================
// Capture Frame
// ========================================
camera_fb_t* CameraModule::captureFrame() {
    if (!_initialized) {
        Serial.println("[Camera] ERROR: Not initialized");
        return NULL;
    }
    
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
        Serial.println("[Camera] ERROR: Frame capture failed");
        return NULL;
    }
    
    return fb;
}

// ========================================
// Release Frame
// ========================================
void CameraModule::releaseFrame(camera_fb_t* fb) {
    if (fb != NULL) {
        esp_camera_fb_return(fb);
    }
}

// ========================================
// Get Frame Size Name
// ========================================
const char* CameraModule::getFrameSizeName() {
    switch (_frameSize) {
        case FRAMESIZE_96X96:   return "96x96";
        case FRAMESIZE_QQVGA:   return "160x120";
        case FRAMESIZE_QCIF:    return "176x144";
        case FRAMESIZE_HQVGA:   return "240x176";
        case FRAMESIZE_240X240: return "240x240";
        case FRAMESIZE_QVGA:    return "320x240";
        case FRAMESIZE_CIF:     return "400x296";
        case FRAMESIZE_HVGA:    return "480x320";
        case FRAMESIZE_VGA:     return "640x480";
        case FRAMESIZE_SVGA:    return "800x600";
        case FRAMESIZE_XGA:     return "1024x768";
        case FRAMESIZE_HD:      return "1280x720";
        case FRAMESIZE_SXGA:    return "1280x1024";
        case FRAMESIZE_UXGA:    return "1600x1200";
        default:                return "Unknown";
    }
}
