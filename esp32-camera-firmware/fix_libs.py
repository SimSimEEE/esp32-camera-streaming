Import("env")
import os

# Add library paths for ESP32 QIO QSPI libs
sdk_path = env.subst("$PROJECT_PACKAGES_DIR/framework-arduinoespressif32/tools/sdk/esp32")
env.Append(
    LIBPATH=[
        os.path.join(sdk_path, "qio_qspi/lib"),
        os.path.join(sdk_path, "lib")
    ]
)
