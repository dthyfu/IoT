

window.allSensorRecords = [
    {
        id: 1,
        temperature: 26.1,
        light: 420,
        humidity: 61,
        time: "2026-09-23 12:00:00"
    },
    {
        id: 2,
        temperature: 26.3,
        light: 450,
        humidity: 62,
        time: "2026-09-23 12:05:00"
    },
    {
        id: 3,
        temperature: 26.5,
        light: 480,
        humidity: 63,
        time: "2026-09-23 12:10:00"
    },
    {
        id: 4,
        temperature: 26.8,
        light: 510,
        humidity: 64,
        time: "2026-09-23 12:15:00"
    },
    {
        id: 5,
        temperature: 27.0,
        light: 560,
        humidity: 65,
        time: "2026-09-23 12:20:00"
    },
    {
        id: 6,
        temperature: 27.2,
        light: 610,
        humidity: 66,
        time: "2026-09-23 12:25:00"
    },
    {
        id: 7,
        temperature: 27.5,
        light: 670,
        humidity: 67,
        time: "2026-09-23 12:30:00"
    },
    {
        id: 8,
        temperature: 27.8,
        light: 720,
        humidity: 68,
        time: "2026-09-23 12:35:00"
    },
    {
        id: 9,
        temperature: 28.0,
        light: 760,
        humidity: 69,
        time: "2026-09-23 12:40:00"
    },
    {
        id: 10,
        temperature: 28.2,
        light: 780,
        humidity: 70,
        time: "2026-09-23 12:45:00"
    },
    {
        id: 11,
        temperature: 28.0,
        light: 740,
        humidity: 69,
        time: "2026-09-23 12:50:00"
    },
    {
        id: 12,
        temperature: 27.7,
        light: 680,
        humidity: 68,
        time: "2026-09-23 12:55:00"
    },
    {
        id: 13,
        temperature: 27.4,
        light: 620,
        humidity: 67,
        time: "2026-09-23 13:00:00"
    },
    {
        id: 14,
        temperature: 27.1,
        light: 570,
        humidity: 66,
        time: "2026-09-23 13:05:00"
    },
    {
        id: 15,
        temperature: 26.8,
        light: 520,
        humidity: 65,
        time: "2026-09-23 13:10:00"
    }
];

// ============================================================
// ACTIVE HISTORY MOCK DATA
// ============================================================

window.allHistoryRecords = [

    {
        id: 1,
        deviceName: "Light",
        action: "On",
        deviceStatus: "On",
        performedBy: "Admin",
        time: "2026-09-23 12:00:10"
    },

    {
        id: 2,
        deviceName: "Fan",
        action: "On",
        deviceStatus: "On",
        performedBy: "User",
        time: "2026-09-23 12:05:20"
    },

    {
        id: 3,
        deviceName: "Air Conditioner",
        action: "On",
        deviceStatus: "On",
        performedBy: "Admin",
        time: "2026-09-23 12:10:35"
    },

    {
        id: 4,
        deviceName: "Light",
        action: "Off",
        deviceStatus: "Off",
        performedBy: "User",
        time: "2026-09-23 12:15:40"
    },

    {
        id: 5,
        deviceName: "Fan",
        action: "Off",
        deviceStatus: "Off",
        performedBy: "Admin",
        time: "2026-09-23 12:20:15"
    },

    {
        id: 6,
        deviceName: "Light",
        action: "On",
        deviceStatus: "On",
        performedBy: "User",
        time: "2026-09-23 12:25:50"
    },

    {
        id: 7,
        deviceName: "Air Conditioner",
        action: "Off",
        deviceStatus: "Off",
        performedBy: "Admin",
        time: "2026-09-23 12:30:25"
    },

    {
        id: 8,
        deviceName: "Fan",
        action: "On",
        deviceStatus: "On",
        performedBy: "User",
        time: "2026-09-23 12:35:45"
    },

    {
        id: 9,
        deviceName: "Light",
        action: "Off",
        deviceStatus: "Off",
        performedBy: "Admin",
        time: "2026-09-23 12:40:30"
    },

    {
        id: 10,
        deviceName: "Air Conditioner",
        action: "On",
        deviceStatus: "On",
        performedBy: "User",
        time: "2026-09-23 12:45:55"
    },

    {
        id: 11,
        deviceName: "Fan",
        action: "Off",
        deviceStatus: "Off",
        performedBy: "Admin",
        time: "2026-09-23 12:50:20"
    },

    {
        id: 12,
        deviceName: "Light",
        action: "On",
        deviceStatus: "On",
        performedBy: "User",
        time: "2026-09-23 12:55:35"
    },

    {
        id: 13,
        deviceName: "Air Conditioner",
        action: "Off",
        deviceStatus: "Off",
        performedBy: "Admin",
        time: "2026-09-23 13:00:45"
    },

    {
        id: 14,
        deviceName: "Fan",
        action: "On",
        deviceStatus: "On",
        performedBy: "User",
        time: "2026-09-24 13:05:10"
    },

    {
        id: 15,
        deviceName: "Light",
        action: "Off",
        deviceStatus: "Off",
        performedBy: "Admin",
        time: "2026-09-23 13:10:25"
    }

];

window.allDatasensorRecords = [
    { id: 1, sensorType: "Temperature Sensor", value: 26.1, unit: "°C", time: "2026-09-23 12:00:00" },
    { id: 2, sensorType: "Light Sensor", value: 420, unit: "Lux", time: "2026-09-23 12:05:00" },
    { id: 3, sensorType: "Humidity Sensor", value: 61, unit: "%", time: "2026-09-23 12:10:00" },
    { id: 4, sensorType: "Temperature Sensor", value: 26.5, unit: "°C", time: "2026-09-23 12:15:00" },
    { id: 5, sensorType: "Light Sensor", value: 510, unit: "Lux", time: "2026-09-23 12:20:00" },
    { id: 6, sensorType: "Humidity Sensor", value: 64, unit: "%", time: "2026-09-23 12:25:00" },
    { id: 7, sensorType: "Temperature Sensor", value: 27.0, unit: "°C", time: "2026-09-23 12:30:00" },
    { id: 8, sensorType: "Light Sensor", value: 670, unit: "Lux", time: "2026-09-23 12:35:00" },
    { id: 9, sensorType: "Humidity Sensor", value: 67, unit: "%", time: "2026-09-23 12:40:00" },
    { id: 10, sensorType: "Temperature Sensor", value: 27.8, unit: "°C", time: "2026-09-23 12:45:00" },
    { id: 11, sensorType: "Light Sensor", value: 780, unit: "Lux", time: "2026-09-23 12:50:00" },
    { id: 12, sensorType: "Humidity Sensor", value: 70, unit: "%", time: "2026-09-23 12:55:00" },
    { id: 13, sensorType: "Temperature Sensor", value: 27.4, unit: "°C", time: "2026-09-23 13:00:00" },
    { id: 14, sensorType: "Light Sensor", value: 620, unit: "Lux", time: "2026-09-23 13:05:00" },
    { id: 15, sensorType: "Humidity Sensor", value: 67, unit: "%", time: "2026-09-23 13:10:00" }
];