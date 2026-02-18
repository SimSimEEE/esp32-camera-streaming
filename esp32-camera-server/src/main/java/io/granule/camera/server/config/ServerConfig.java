/**
 * `ServerConfig.java`
 * - Server configuration constants
 * - 모든 서버 설정값을 한 곳에서 관리
 *
 * @author      Sim Woo-Keun <smileteeth14@gmail.com>
 * @date        2026-02-18 initial version
 *
 * @copyright   (C) 2026 Granule Co Ltd. - All Rights Reserved.
 */
package io.granule.camera.server.config;

/**
 * Server Configuration
 * Centralized configuration for the WebSocket server
 */
public final class ServerConfig {
    
    // ========================================
    // Server Configuration
    // ========================================
    
    /**
     * WebSocket server port
     * - Default: 8887
     * - Can be overridden by command line argument
     */
    public static final int DEFAULT_PORT = 8887;
    
    /**
     * Server host address for binding
     * - null = bind to all interfaces (0.0.0.0)
     */
    public static final String SERVER_HOST = null;
    
    /**
     * WebSocket endpoint paths
     */
    public static final String ENDPOINT_ESP32 = "/esp32";
    public static final String ENDPOINT_VIEWER = "/viewer";
    
    // ========================================
    // Connection Configuration
    // ========================================
    
    /**
     * WebSocket connection timeout (ms)
     */
    public static final int CONNECTION_TIMEOUT = 30000; // 30 seconds
    
    /**
     * WebSocket ping interval (ms)
     */
    public static final int PING_INTERVAL = 30000; // 30 seconds
    
    /**
     * Maximum frame size (bytes)
     * - 1MB for camera frames
     */
    public static final int MAX_FRAME_SIZE = 1024 * 1024; // 1MB
    
    // ========================================
    // Statistics Configuration
    // ========================================
    
    /**
     * Statistics logging interval (ms)
     */
    public static final long STATS_LOG_INTERVAL = 60000; // 1 minute
    
    /**
     * Enable statistics logging
     */
    public static final boolean STATS_LOGGING_ENABLED = true;
    
    // ========================================
    // Performance Configuration
    // ========================================
    
    /**
     * Enable TCP socket reuse
     */
    public static final boolean REUSE_ADDRESS = true;
    
    /**
     * TCP no delay (disable Nagle's algorithm)
     */
    public static final boolean TCP_NO_DELAY = true;
    
    /**
     * Socket buffer size (bytes)
     */
    public static final int SOCKET_BUFFER_SIZE = 65536; // 64KB
    
    // ========================================
    // Application Info
    // ========================================
    
    /**
     * Application name
     */
    public static final String APP_NAME = "ESP32 Camera Stream Server";
    
    /**
     * Application version
     */
    public static final String APP_VERSION = "1.6.1";
    
    /**
     * Application author
     */
    public static final String APP_AUTHOR = "Granule Co Ltd";
    
    // ========================================
    // Environment Detection
    // ========================================
    
    /**
     * Check if running in production environment
     */
    public static final boolean isProduction() {
        final String env = System.getenv("ENV");
        return "production".equalsIgnoreCase(env) || "prod".equalsIgnoreCase(env);
    }
    
    /**
     * Check if running in development environment
     */
    public static final boolean isDevelopment() {
        return !isProduction();
    }
    
    /**
     * Get server port from environment variable or use default
     */
    public static final int getPort() {
        final String portEnv = System.getenv("SERVER_PORT");
        if (portEnv != null && !portEnv.isEmpty()) {
            try {
                return Integer.parseInt(portEnv);
            } catch (NumberFormatException e) {
                return DEFAULT_PORT;
            }
        }
        return DEFAULT_PORT;
    }
    
    // ========================================
    // Utility Methods
    // ========================================
    
    /**
     * Print configuration summary
     */
    public static final void printConfig() {
        System.out.println("========================================");
        System.out.println(APP_NAME + " v" + APP_VERSION);
        System.out.println("========================================");
        System.out.println("Environment: " + (isProduction() ? "Production" : "Development"));
        System.out.println("Port: " + getPort());
        System.out.println("ESP32 Endpoint: ws://localhost:" + getPort() + ENDPOINT_ESP32);
        System.out.println("Viewer Endpoint: ws://localhost:" + getPort() + ENDPOINT_VIEWER);
        System.out.println("Max Frame Size: " + (MAX_FRAME_SIZE / 1024) + "KB");
        System.out.println("Statistics Logging: " + (STATS_LOGGING_ENABLED ? "Enabled" : "Disabled"));
        System.out.println("========================================");
    }
    
    // Private constructor to prevent instantiation
    private ServerConfig() {
        throw new AssertionError("Cannot instantiate utility class");
    }
}
