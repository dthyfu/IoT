
const API_BASE_URL = "http://localhost:8080/api";

const ApiService = {
    // Lấy dữ liệu cảm biến mới nhất từ Spring Boot
    async getLatestSensorData() {
        const response = await fetch(
            `${API_BASE_URL}/sensor-data/latest`
        );

        if (!response.ok) {
            throw new Error(
                `Không thể lấy dữ liệu cảm biến: HTTP ${response.status}`
            );
        }

        return await response.json();
    },

    // Điều khiển thiết bị thông qua Spring Boot và MQTT
    
    async controlDevice(device, status) {
        const ledMapping = {
            "Light": "led1",
            "Air Conditioner": "led2",
            "Fan": "led3"
        };

        const led = ledMapping[device];

        if (!led) {
            throw new Error(`Thiết bị không hợp lệ: ${device}`);
        }

        const action = String(status).toLowerCase();

        if (action !== "on" && action !== "off") {
            throw new Error(`Trạng thái không hợp lệ: ${status}`);
        }

        const response = await fetch(`${API_BASE_URL}/device/control`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                led: led,
                action: action
            })
        });

        if (!response.ok) {
            throw new Error(
                `Không thể điều khiển thiết bị: HTTP ${response.status}`
            );
        }

        return await response.json();
    }

};
