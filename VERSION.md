# Version Management Strategy

## Version Scheme

This project follows [Semantic Versioning 2.0.0](https://semver.org/)

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes or major architectural updates
MINOR: New features, backward-compatible
PATCH: Bug fixes, backward-compatible
```

## Current Versions

- **Client**: 1.1.0
- **Server**: 1.6.0
- **Firmware**: 1.1.0

## Version History

### v1.11.0 (2026-02-19)

**Type**: MINOR (Server)

**Changes**:

- add /analyzer WebSocket endpoint for motion detector


### v1.10.1 (2026-02-19)

**Type**: PATCH (Server)

**Changes**:

- Dockerfile - replace libgl1-mesa-glx with libgl1 for Debian trixie


### v1.10.0 (2026-02-19)

**Type**: MINOR (Server)

**Changes**:

- motion-detector integration - docker-compose, web client, Python service


### v1.9.0 (2026-02-19)

**Type**: MINOR (Server)

**Changes**:

- deploy-ec2.sh Docker Compose option added (motion-detector support)


### v1.6.0 (2026-02-19)

**Type**: MINOR (All Components)

**Breaking Changes**: None

**New Features**:

#### Motion Detection System (Server 1.6.0, Client 1.1.0)

- ✅ **AI-Powered Motion Detection Service**
    - Python-based motion detection with OpenCV
    - Real-time frame analysis with configurable sensitivity
    - AI-powered motion reason detection using OpenAI GPT-4o
    - Fallback to local heuristic analysis without API key
    - Automatic snapshot capture with timestamps
    - WebSocket integration with camera server
- ✅ **Client Integration**
    - MotionAlerts component for real-time notifications
    - Motion event history display
    - AI-generated motion reason display
    - Responsive design with smooth animations
- ✅ **Deployment Automation**
    - One-command deployment script (start-with-motion-detection.sh)
    - Docker support with auto-build
    - Comprehensive setup guide (MOTION_DETECTION_GUIDE.md)

#### Server Enhancements (Server 1.6.0)

- ✅ **Enhanced Module Architecture**
    - Improved ConnectionManager for multi-client handling
    - Enhanced FrameRelayService with motion detector integration
    - Optimized ViewerStatsService for real-time monitoring
    - Better WebSocket message routing
    - Thread-safe operations improvements
- ✅ **Build & Deployment**
    - Multi-stage Docker build optimization
    - Updated Maven dependencies
    - Motion detector service integration
    - Faster build and deployment scripts

#### Firmware Improvements (Firmware 1.1.0)

- ✅ **Streaming Optimization**
    - Optimized CameraModule for better frame capture
    - Enhanced LedModule with smoother state transitions
    - Lower latency frame transmission
    - Better LED feedback for motion events
    - Improved WebSocket connection stability
    - Enhanced error handling and recovery

#### Client UI Enhancements (Client 1.1.0)

- ✅ **Portfolio Components**
    - Improved CameraViewer with better controls
    - Enhanced Hero, IoTDashboard, and other components
    - Better responsive design across devices
    - Smoother transitions and interactions
- ✅ **Configuration**
    - Added config.js for environment settings
    - Development server improvements
    - Better build configuration

#### Documentation (All)

- ✅ **Cleanup & Reorganization**
    - Removed obsolete documentation files
    - Removed legacy portfolio directory
    - Updated README.md with motion detection info
    - Updated DEPLOY_GUIDE.md with new deployment steps
    - Consolidated version management in VERSION.md

**Technical Details**:

- **Motion Detection Stack**: Python 3.11, OpenCV, WebSocket, OpenAI API
- **Server Stack**: Java 23, Maven, WebSocket (Tyrus)
- **Client Stack**: React 18, TypeScript, Tailwind CSS, Vite
- **Firmware Stack**: Arduino, ESP32-CAM, WebSocket

**Migration Notes**:

- No breaking changes - fully backward compatible
- Motion detection is opt-in feature
- Existing deployments work without changes
- To enable motion detection, use `start-with-motion-detection.sh`

### v1.5.0 (2026-02-19)

**Type**: MINOR (Server)

**Changes**:

- Add DuckDNS setup scripts and environment variables for fixed WebSocket URL

### v1.4.0 (2026-02-18)

**Type**: MINOR (Server)

**Changes**:

- integrate full portfolio into esp32-camera-client and remove legacy version

### v1.3.0 (2026-02-18)

**Type**: MINOR (Server)

**Changes**:

- transform esp32-camera-client to portfolio edition with React + TypeScript + Tailwind CSS

### v1.2.0 (2026-02-18)

**Type**: MINOR (Server)

**Changes**:

- add portfolio website with ESP32-CAM real-time WebSocket integration

### v1.1.1 (2026-02-18)

**Type**: PATCH (Server)

**Bug Fixes**:

- ✅ Fixed docker-compose.yml volumes path for nginx and client files
    - Changed from `./` to `../` to reference parent directory
    - nginx.conf: `./nginx.conf` → `../nginx.conf`
    - esp32-camera-client: `./esp32-camera-client` → `../esp32-camera-client`
- ✅ Disabled health check for WebSocket server
    - Removed HTTP-based health check (returned 404)
    - WebSocket servers don't provide HTTP endpoints
    - Server functionality verified through actual WebSocket connections
- ✅ Fixed WebSocket proxy connection
    - nginx client can now resolve `camera-server` hostname
    - Both containers properly connected to `esp32-camera-server_camera-network`

**Technical Details**:

- docker-compose.yml context: Working directory is `esp32-camera-server/`
- File locations: nginx.conf and esp32-camera-client are in parent directory
- Network: Docker DNS resolves service names within same network

### v1.1.0 (2026-02-18)

**Type**: MINOR (Server)

**Features**:

- ✅ Race Condition prevention for LED control
- ✅ Semaphore-based LED control lock (fair, 500ms timeout)
- ✅ Thread-safe firmware version tracking (AtomicReference)
- ✅ Viewer count broadcast debouncing (100ms)
- ✅ ReentrantLock with fairness for critical sections

**Breaking Changes**:

- LED control rejects concurrent requests with `LED_BUSY` message
- Viewer count broadcasts are debounced

**Technical Details**:

- Added `java.util.concurrent.Semaphore` for LED control
- Converted `firmwareVersion` from `String` to `AtomicReference<String>`
- Added `ReentrantLock` for viewer count broadcasts
- Debouncing interval: 100ms

### v1.0.1 (2026-02-17)

**Type**: PATCH

**Changes**:

- Fixed Dockerfile JAR version mismatch
- Updated WebSocket path configuration
- Synchronized versions across all components

---

## Version Update Checklist

### 📋 Pre-Update

- [ ] Determine version change type (MAJOR/MINOR/PATCH)
- [ ] Review breaking changes
- [ ] Test locally
- [ ] Update CHANGELOG

### 📝 Code Updates

Execute in this order to prevent dependency errors:

1. **Server** (if changed)

    ```bash
    # Update these files:
    - esp32-camera-server/pom.xml (line 9)
    - esp32-camera-server/src/main/java/io/granule/camera/server/config/ServerConfig.java (APP_VERSION)
    - esp32-camera-server/package.json (version)
    - esp32-camera-server/Dockerfile (JAR filename in COPY command)
    ```

2. **Client** (if changed)

    ```bash
    # Update these files:
    - esp32-camera-client/package.json (version)
    - esp32-camera-client/config.js (appVersion, versions.client)
    - esp32-camera-client/config.js (versions.server - if server changed)
    ```

3. **Firmware** (if changed)
    ```bash
    # Update these files:
    - esp32-camera-firmware/package.json (version)
    - esp32-camera-firmware/src/Config.h (APP_VERSION)
    - esp32-camera-firmware/ESP32_Camera_Stream/Config.h (APP_VERSION)
    ```

### ⚠️ Critical Synchronization Points

- **Dockerfile COPY command** MUST match `pom.xml` version
- **config.js versions.server** MUST match `ServerConfig.APP_VERSION`
- **config.js versions.firmware** MUST match firmware `APP_VERSION`

### 🔧 Build & Test

- [ ] Build server: `cd esp32-camera-server && mvn clean package`
- [ ] Build Docker image: `docker-compose build camera-server`
- [ ] Test locally: `docker-compose up`
- [ ] Verify version display in browser

### 📤 Git Operations

```bash
# Stage all changes
git add -A

# Commit with semantic message
git commit -m "feat|fix|chore: description

- Detail 1
- Detail 2

Version Updates:
- Component: X.Y.Z → X.Y.Z"

# Push to GitHub
git push origin master
```

### 🚀 Deployment

```bash
# 1. Deploy client files
rsync -avz -e "ssh -i ~/Downloads/my-key.pem" \
  --exclude 'node_modules' --exclude '.git' \
  esp32-camera-client/ \
  ec2-user@52.79.241.244:/home/ec2-user/esp32-camera-client/

# 2. Deploy server source
rsync -avz -e "ssh -i ~/Downloads/my-key.pem" \
  --exclude 'target' --exclude 'node_modules' --exclude '.git' \
  esp32-camera-server/ \
  ec2-user@52.79.241.244:/home/ec2-user/esp32-camera-server/

# 3. Rebuild and restart server
ssh -i ~/Downloads/my-key.pem ec2-user@52.79.241.244 \
  "docker stop esp32-camera-server && \
   docker rm esp32-camera-server && \
   cd /home/ec2-user/esp32-camera-server && \
   docker-compose up -d camera-server"

# 4. Verify deployment
ssh -i ~/Downloads/my-key.pem ec2-user@52.79.241.244 \
  "docker logs esp32-camera-server 2>&1 | grep -i 'ESP32 Camera Stream Server v' | head -1"
```

### 🔍 Post-Deployment Verification

- [ ] Check server logs: `docker logs esp32-camera-server`
- [ ] Open browser: http://52.79.241.244
- [ ] Verify footer versions match expected values
- [ ] Test functionality:
    - [ ] Video stream
    - [ ] LED control
    - [ ] Viewer count
    - [ ] Multi-user LED control (Race Condition test)

### 📱 ESP32 Firmware Upload (if firmware changed)

```bash
cd esp32-camera-firmware
pio run -t upload
pio device monitor
```

---

## Version File Locations

### Server Version Sources

| File                | Line | Variable      | Purpose                              |
| ------------------- | ---- | ------------- | ------------------------------------ |
| `pom.xml`           | 9    | `<version>`   | Maven build, determines JAR filename |
| `ServerConfig.java` | 107  | `APP_VERSION` | Runtime version display              |
| `package.json`      | 3    | `"version"`   | Documentation                        |
| `Dockerfile`        | 20   | COPY path     | **CRITICAL**: Must match pom.xml     |

### Client Version Sources

| File           | Line  | Variable     | Purpose               |
| -------------- | ----- | ------------ | --------------------- |
| `package.json` | 3     | `"version"`  | Documentation         |
| `config.js`    | 56    | `appVersion` | App metadata          |
| `config.js`    | 58-61 | `versions`   | Version display in UI |

### Firmware Version Sources

| File                           | Line | Variable      | Purpose             |
| ------------------------------ | ---- | ------------- | ------------------- |
| `package.json`                 | 3    | `"version"`   | Documentation       |
| `src/Config.h`                 | 118  | `APP_VERSION` | Build configuration |
| `ESP32_Camera_Stream/Config.h` | 117  | `APP_VERSION` | Arduino sketch      |

---

## Common Issues & Solutions

### Issue: Docker build fails with "JAR not found"

**Cause**: Dockerfile COPY references old version
**Solution**: Update Dockerfile line 20 to match pom.xml version

### Issue: Version mismatch in browser footer

**Cause**: Client config.js not updated
**Solution**: Update `config.js` lines 58-61

### Issue: Container name conflict during deployment

**Solution**:

```bash
docker stop esp32-camera-server
docker rm esp32-camera-server
docker-compose up -d camera-server
```

---

## Versioning Best Practices

### DO ✅

- Update all related files in one commit
- Test locally before deploying
- Use semantic commit messages
- Update this VERSION.md file
- Verify Dockerfile JAR version matches pom.xml
- Tag releases: `git tag v1.1.0 && git push --tags`

### DON'T ❌

- Skip version updates in any component
- Deploy without testing
- Update Dockerfile without updating pom.xml
- Forget to restart Docker container after deployment
- Mix multiple version changes in one commit

---

## Emergency Rollback

If deployment fails, rollback to previous version:

```bash
# 1. Check previous version
git log --oneline -5

# 2. Revert to previous commit
git revert HEAD

# 3. Re-deploy (follow deployment steps above)
```

Or restore specific version:

```bash
# 1. Checkout previous version
git checkout v1.0.1

# 2. Re-deploy
# ... follow deployment steps
```

---

**Last Updated**: 2026-02-18  
**Maintained By**: Sim Si-Geun <sim@granule.io>
