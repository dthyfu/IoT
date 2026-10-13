const pendingCommands = {};

function updateDeviceStatus(device, status) {
    const statusElement = document.querySelector(`[data-status-for="${device}"]`);
    if (statusElement) {
        statusElement.textContent = status;
    }
}

function cancelPendingCommand(device, input, previousState) {
    const pending = pendingCommands[device];

    if (pending && pending.timer) {
        clearTimeout(pending.timer);
    }

    input.checked = previousState;
    input.disabled = false;

    const switchElement = input.closest(".switch");

    if (switchElement) {
        switchElement.classList.remove("pending");
    }

    updateDeviceStatus(device, previousState ? "On" : "Off");
    delete pendingCommands[device];
}

document.querySelectorAll(".switch input").forEach(input => {
    input.addEventListener("change", async () => {
        const device = input.dataset.device;
        const previousState = !input.checked;
        const requestedStatus = input.checked ? "On" : "Off";
        const switchElement = input.closest(".switch");

        input.disabled = true;

        if (switchElement) {
            switchElement.classList.add("pending");
        }

        updateDeviceStatus(device, "Pending");

        pendingCommands[device] = {
            previousState,
            requestedStatus,
            timer: null
        };

        pendingCommands[device].timer = setTimeout(() => {
            cancelPendingCommand(device, input, previousState);
            console.error(`[Device Control] ${device}: Device did not respond.`);
            alert(`${device}: Device did not respond.`);
        }, 5000);

        
        try {
            // Gửi lệnh đến Spring Boot và MQTT
            await ApiService.controlDevice(device, requestedStatus);

            // Chưa gọi updateDeviceState() ở đây.
            // Tiếp tục Pending cho đến khi nhận xác nhận từ ESP32.
        } catch (error) {
            cancelPendingCommand(device, input, previousState);

            console.error(
                "[Device Control] Unable to send device command:",
                error
            );

            alert("Không thể gửi lệnh điều khiển thiết bị.");
        }

    });
});

function updateDeviceState(device, status) {
    const input = document.querySelector(`.switch input[data-device="${device}"]`);

    if (!input) {
        return;
    }

    const switchElement = input.closest(".switch");
    const pending = pendingCommands[device];

    if (pending && pending.timer) {
        clearTimeout(pending.timer);
    }

    input.checked = status === "On";
    input.disabled = false;

    if (switchElement) {
        switchElement.classList.remove("pending");
    }
    const deviceIcon = document.querySelector(
        `[data-device-icon="${device}"]`
    );

    if (deviceIcon) {
        deviceIcon.classList.toggle(
            "is-on",
            String(status).toLowerCase() === "on"
        );
    }

    updateDeviceStatus(device, status);
    delete pendingCommands[device];
}


/* =========================================
   WEBSOCKET: NHAN TRANG THAI TU SPRING BOOT
   ========================================= */

let deviceStatusClient = null;

function connectDeviceStatusWebSocket() {
    if (typeof Stomp === "undefined") {
        console.error(
            "[WebSocket] Khong tim thay thu vien STOMP."
        );
        return;
    }

    // Ket noi truc tiep den WebSocket cua Spring Boot
    const socket = new WebSocket(
        "ws://localhost:8080/ws"
    );

    deviceStatusClient = Stomp.over(socket);

    // Tat log STOMP de console gon hon
    deviceStatusClient.debug = () => {};

    deviceStatusClient.connect(
        {},
        function () {
            console.log(
                "[WebSocket] Da ket noi Spring Boot."
            );

            // Lang nghe trang thai LED tu backend
            deviceStatusClient.subscribe(
                "/topic/device-status",
                function (message) {
                    try {
                        const data = JSON.parse(message.body);

                        console.log(
                            "[WebSocket] Nhan trang thai:",
                            data
                        );

                        if (data.device && data.status) {
                            const deviceNames = {
                                led1: "Light",
                                led2: "Air Conditioner",
                                led3: "Fan"
                            };

                            const deviceName = deviceNames[data.device] || data.device;

                            updateDeviceState(deviceName, data.status);
                        }
                    } catch (error) {
                        console.error(
                            "[WebSocket] Loi doc trang thai:",
                            error
                        );
                    }
                }
            );
        },
        function (error) {
            console.error(
                "[WebSocket] Khong the ket noi:",
                error
            );
        }
    );
}

// Lay trang thai thiet bi tu backend khi mo Dashboard

async function loadInitialDeviceStates() {
    try {
        const response = await fetch("http://localhost:8080/api/devices/status");

        if (!response.ok) {
            throw new Error("Khong the tai trang thai thiet bi");
        }

        const devices = await response.json();

        const deviceNames = {
            1: "Light",
            2: "Air Conditioner",
            3: "Fan"
        };

        devices.forEach(device => {
            const deviceName = deviceNames[device.id];

            if (!deviceName) return;

            const currentStatus =
                String(device.current_status).toUpperCase() === "ON"
                    ? "On"
                    : "Off";

            updateDeviceState(deviceName, currentStatus);
        });

        console.log("[Device Control] Da khoi phuc trang thai tu database.");
    } catch (error) {
        console.error(
            "[Device Control] Khong the tai trang thai thiet bi:",
            error
        );
    }
}

loadInitialDeviceStates();
connectDeviceStatusWebSocket();

// Ket noi khi trang Dashboard da tai xong
loadInitialDeviceStates();
connectDeviceStatusWebSocket();

