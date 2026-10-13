
const chartSelect = document.getElementById("chartSensorSelect");
const reloadButton = document.getElementById("reloadChartButton");

let dashboardSensorState = {
    temperature: null,
    light: null,
    humidity: null,
    timestamp: null
};

let dashboardChartData = [];

// Cập nhật ba thẻ cảm biến trên Dashboard
function updateSensorCards(sensorData) {
    document.getElementById("temperatureValue").textContent =
        sensorData.temperature == null
            ? "--°C"
            : `${sensorData.temperature}°C`;

    document.getElementById("lightValue").textContent =
        sensorData.light == null
            ? "-- Lux"
            : `${sensorData.light} Lux`;

    document.getElementById("humidityValue").textContent =
        sensorData.humidity == null
            ? "--%"
            : `${sensorData.humidity}%`;
}

// Chuyển JSON từ backend thành dữ liệu Dashboard cần
function convertSensorRecords(records) {
    const sensorData = {
        temperature: null,
        light: null,
        humidity: null,
        timestamp: null
    };

    if (!Array.isArray(records)) {
        return sensorData;
    }

    records.forEach(record => {
        const type = record.sensor_type;
        const value = Number(record.value);

        if (record.value == null || !Number.isFinite(value)) {
            return;
        }

        if (type === "temperature") {
            sensorData.temperature = value;
        } else if (type === "light") {
            sensorData.light = value;
        } else if (type === "humidity") {
            sensorData.humidity = value;
        }

        if (
            record.measured_at &&
            (!sensorData.timestamp ||
             record.measured_at > sensorData.timestamp)
        ) {
            sensorData.timestamp = record.measured_at;
        }
    });

    return sensorData;
}

// Lấy dữ liệu cảm biến mới nhất từ Spring Boot

async function loadInitialDashboardData() {
    try {
        // Lấy giá trị mới nhất cho 3 thẻ cảm biến.
        const records = await ApiService.getLatestSensorData();
        dashboardSensorState = convertSensorRecords(records);
        updateSensorCards(dashboardSensorState);

        // Tải lịch sử ban đầu cho biểu đồ.
        const response = await fetch(
            "http://localhost:8080/api/sensor-data/history"
        );

        if (!response.ok) {
            throw new Error("Không thể tải lịch sử cảm biến");
        }

        const history = await response.json();

        dashboardChartData = history.map(record => ({
            temperature: record.temperature == null
                ? null : Number(record.temperature),
            light: record.light == null
                ? null : Number(record.light),
            humidity: record.humidity == null
                ? null : Number(record.humidity),
            time: record.measured_at,
            timestamp: record.measured_at
        })).slice(-15);

        SensorChart.setData(dashboardChartData);

    } catch (error) {
        console.error("Không thể tải dữ liệu Dashboard:", error);
    }
}

// Cập nhật thẻ cảm biến và chỉ thêm điểm đo mới vào biểu đồ.
async function refreshDashboardData() {
    try {
        const records = await ApiService.getLatestSensorData();

        dashboardSensorState = convertSensorRecords(records);
        updateSensorCards(dashboardSensorState);

        const response = await fetch(
            "http://localhost:8080/api/sensor-data/history"
        );

        if (!response.ok) {
            throw new Error("Không thể tải lịch sử cảm biến");
        }

        const history = await response.json();

        const newPoints = history
            .filter(record => {
                if (!record.measured_at) return false;

                const lastPoint = dashboardChartData[
                    dashboardChartData.length - 1
                ];

                return !lastPoint ||
                    record.measured_at > lastPoint.timestamp;
            })
            .map(record => ({
                temperature: record.temperature == null
                    ? null : Number(record.temperature),
                light: record.light == null
                    ? null : Number(record.light),
                humidity: record.humidity == null
                    ? null : Number(record.humidity),
                time: record.measured_at,
                timestamp: record.measured_at
            }));

        if (newPoints.length > 0) {
            dashboardChartData = [
                ...dashboardChartData,
                ...newPoints
            ].slice(-15);

            SensorChart.setData(dashboardChartData);
        }

    } catch (error) {
        console.error("Không thể cập nhật biểu đồ:", error);
    }
}


// Xử lý dữ liệu khi nhận được cập nhật mới
function handleRealtimeSensorData(sensorData) {
    dashboardSensorState = {
        ...dashboardSensorState,
        ...sensorData
    };

    updateSensorCards(dashboardSensorState);

    const pointTime =
        sensorData.timestamp || sensorData.time;

    if (pointTime) {
        dashboardChartData.push({
            ...dashboardSensorState,
            ...sensorData,
            time: pointTime,
            timestamp: pointTime
        });

        dashboardChartData = dashboardChartData.slice(-15);
        SensorChart.setData(dashboardChartData);
    }
}

// Đổi loại cảm biến hiển thị trên biểu đồ
chartSelect.addEventListener("change", () => {
    SensorChart.setSensor(chartSelect.value);
});

// Vẽ lại biểu đồ khi nhấn nút tải lại
reloadButton.addEventListener("click", async () => {
    reloadButton.disabled = true;

    try {
        await loadInitialDashboardData();
        SensorChart.redraw();
    } finally {
        reloadButton.disabled = false;
    }
});

// Tải dữ liệu ngay khi mở Dashboard
loadInitialDashboardData();


