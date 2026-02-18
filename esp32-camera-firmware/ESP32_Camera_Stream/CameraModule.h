/**
 * `CameraModule.h`
 * - ESP32-CAM camera initialization and frame capture module
 * - Handles: Camera config, sensor settings, frame acquisition
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */

#ifndef CAMERA_MODULE_H
#define CAMERA_MODULE_H

#include <Arduino.h>
#include "esp_camera.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

// ========================================
// Camera Pin Configuration (AI-Thinker ESP32-CAM)
// ========================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

/**
 * Camera Module Class
 * Manages camera initialization, configuration, and frame capture
 */
class CameraModule {
public:
    /**
     * Constructor
     */
    CameraModule();

    /**
     * Initialize camera with optimal settings
     * @return true if initialization successful, false otherwise
     */
    bool init();

    /**
     * Capture a single frame from camera
     * @return camera_fb_t* Frame buffer pointer (must be released after use)
     */
    camera_fb_t* captureFrame();

    /**
     * Release frame buffer back to camera
     * @param fb Frame buffer to release
     */
    void releaseFrame(camera_fb_t* fb);

    /**
     * Get frame size name
     * @return Current frame size as string
     */
    const char* getFrameSizeName();

    /**
     * Check if camera is initialized
     * @return true if initialized, false otherwise
     */
    bool isInitialized() const { return _initialized; }

private:
    /**
     * Configure camera sensor settings for optimal quality
     */
    void configureSensor();

    bool _initialized;
    framesize_t _frameSize;
};

#endif // CAMERA_MODULE_H
