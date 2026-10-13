
/*
 * WebSocket: Nhan trang thai thiet bi va du lieu cam bien
 * tu Spring Boot Backend.
 */

const deviceStatusSocket = {
    client: null,
    connected: false,

    connect() {
        if (typeof Stomp === "undefined") {
            console.error("[WebSocket] Khong tim thay thu vien STOMP.");
            return;
        }

        if (this.connected) {
            return;
        }

        const socket = new WebSocket("ws://localhost:8080/ws");
        const client = Stomp.over(socket);

        client.debug = () => {};
        this.client = client;

        client.connect(
            {},
            () => {
                this.connected = true;
                console.log("[WebSocket] Da ket noi Spring Boot.");

                // 1. Nhan trang thai thiet bi
                client.subscribe("/topic/device-status", (message) => {
                    try {
                        const data = JSON.parse(message.body);

                        console.log("[WebSocket] Trang thai thiet bi:", data);

                        const deviceMap = {
                            led1: "Light",
                            led2: "Air Conditioner",
                            led3: "Fan"
                        };

                        const device = deviceMap[data.device];
                        const status = data.status;

                        if (
                            device &&
                            ["On", "Off"].includes(status) &&
                            typeof updateDeviceState === "function"
                        ) {
                            updateDeviceState(device, status);
                        }
                    } catch (error) {
                        console.error(
                            "[WebSocket] Loi xu ly trang thai thiet bi:",
                            error
                        );
                    }
                });

                // 2. Nhan du lieu cam bien
                client.subscribe("/topic/sensors", (message) => {
                    try {
                        const sensorData = JSON.parse(message.body);

                        console.log("[WebSocket] Du lieu cam bien:", sensorData);

                        if (
                            typeof handleRealtimeSensorData === "function"
                        ) {
                            handleRealtimeSensorData(sensorData);
                        }
                    } catch (error) {
                        console.error(
                            "[WebSocket] Loi xu ly du lieu cam bien:",
                            error
                        );
                    }
                });

                console.log("[WebSocket] Da dang ky cac kenh nhan du lieu.");
            },
            (error) => {
                this.connected = false;
                console.error("[WebSocket] Ket noi that bai:", error);
            }
        );
    }
};

deviceStatusSocket.connect();
