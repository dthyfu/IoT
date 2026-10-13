
// Store all sensor records returned by Spring Boot.
let allSensorRecords = [];
let sensorRecords = [];
let sensorCurrentPage = 1;
let sensorRowsPerPage = 10;
let sensorLoadError = false;
let sensorLoading = false;

// Get HTML elements.
const sensorSearch = document.getElementById("sensorSearch");
const sensorTypeFilter = document.getElementById("sensorTypeFilter");
const sensorRowsInput = document.getElementById("datasensorRows");
const sensorTableBody = document.getElementById("sensorTableBody");
const sensorPagination = document.getElementById("sensorPagination");
const sensorTotal = document.getElementById("sensorTotal");

// Spring Boot API.
const SENSOR_API_URL = "http://localhost:8080/api/sensor-data";

// Convert sensor type to a readable name.
function getSensorName(type, name) {
    if (name) {
        return name;
    }

    const sensorNames = {
        temperature: "Temperature Sensor",
        light: "Light Sensor",
        humidity: "Humidity Sensor"
    };

    return sensorNames[String(type || "").toLowerCase()] || type || "Unknown";
}

// Format time as dd/MM/yyyy HH:mm:ss.
function formatSensorTime(time) {
    if (!time) {
        return "";
    }

    const value = String(time);
    const match = value.match(
        /(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/
    );

    if (match) {
        const [, year, month, day, hour, minute, second] = match;

        return `${day}/${month}/${year} ${hour}:${minute}:${second || "00"}`;
    }

    return value;
}

// Escape HTML to safely display API data.
function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// Show a message inside the table.
function showSensorMessage(message) {
    sensorTableBody.innerHTML = "";

    const row = document.createElement("tr");
    row.style.height = "100px";

    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = message;
    cell.style.color = "#999999";
    cell.style.fontStyle = "italic";

    row.appendChild(cell);
    sensorTableBody.appendChild(row);

    sensorTotal.textContent = "Results: 0 of 0";
    renderPagination(sensorPagination, 1, 0, () => {});
}

// Load sensor records from Spring Boot.
async function loadSensorData(isAutoRefresh = false) {
    // Prevent overlapping requests.
    if (sensorLoading) return;

    sensorLoading = true;

    try {
        const response = await fetch(SENSOR_API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("The API response is not an array.");
        }

        // Update records without changing the existing filters.
        allSensorRecords = data.map(record => {
            const type = record.sensor_type ?? record.sensorType ?? "";

            return {
                id: record.id ?? record.sensor_id ?? "",
                sensorType: getSensorName(
                    type,
                    record.sensor_name ?? record.sensorName
                ),
                type: String(type).toLowerCase(),
                value: record.value ?? "",
                unit: record.unit ?? "",
                time: record.measured_at
                    ?? record.measuredAt
                    ?? record.time
                    ?? ""
            };
        });

        sensorLoadError = false;

        // Keep the current page during automatic refresh.
        applySensorFilters(!isAutoRefresh);

    } catch (error) {
        console.error("Failed to load sensor data:", error);

        // Keep the currently displayed data if an automatic
        // refresh temporarily fails.
        if (!isAutoRefresh) {
            sensorLoadError = true;
            allSensorRecords = [];
            sensorRecords = [];

            showSensorMessage(
                "Unable to load sensor data. Please check Spring Boot and try again."
            );
        }
    } finally {
        sensorLoading = false;
    }
}

// Render the current page of sensor records.
function renderSensorTable() {
    if (sensorLoadError) {
        return;
    }

    sensorTableBody.innerHTML = "";

    if (sensorRecords.length === 0) {
        showSensorMessage("No sensor data");
        return;
    }

    const start = (sensorCurrentPage - 1) * sensorRowsPerPage;
    const end = start + sensorRowsPerPage;
    const pageRecords = sensorRecords.slice(start, end);

    pageRecords.forEach(record => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHtml(record.id)}</td>
            <td>${escapeHtml(record.sensorType)}</td>
            <td>${escapeHtml(record.value)}${record.unit ? " " + escapeHtml(record.unit) : ""}</td>
            <td>${escapeHtml(formatSensorTime(record.time))}</td>
        `;

        sensorTableBody.appendChild(row);
    });

    const firstRecord = start + 1;
    const lastRecord = Math.min(end, sensorRecords.length);

    sensorTotal.textContent =
        `Results: ${firstRecord}-${lastRecord} of ${sensorRecords.length}`;

    const totalPages = Math.ceil(sensorRecords.length / sensorRowsPerPage);

    // Reuse the existing pagination.js function.
    renderPagination(
        sensorPagination,
        sensorCurrentPage,
        totalPages,
        page => {
            sensorCurrentPage = page;
            renderSensorTable();
        }
    );
}

// Apply search and sensor type filters.
function applySensorFilters(resetPage = true) {
    if (sensorLoadError) {
        return;
    }

    const keyword = sensorSearch.value.trim().toLowerCase();
    const selectedType = sensorTypeFilter.value || "all";

    sensorRecords = allSensorRecords.filter(record => {
        const searchableText = [
            record.id,
            record.sensorType,
            record.type,
            record.value,
            record.unit,
            record.time,
            formatSensorTime(record.time)
        ].join(" ").toLowerCase();

        // Search across all fields.
        const matchesKeyword =
            keyword === "" || searchableText.includes(keyword);

        // Filter by sensor type.
        let matchesType = true;

        if (selectedType === "temperature") {
            matchesType = record.type === "temperature";
        } else if (selectedType === "light") {
            matchesType = record.type === "light";
        } else if (selectedType === "humidity") {
            matchesType = record.type === "humidity";
        } else if (selectedType === "time") {
            matchesType = true;
        }

        return matchesKeyword && matchesType;
    });

    // Reset to page 1 when the user changes filters.
    // During automatic refresh, keep the current page if possible.
    if (resetPage) {
        sensorCurrentPage = 1;
    } else {
        const totalPages = Math.ceil(
            sensorRecords.length / sensorRowsPerPage
        );

        sensorCurrentPage = Math.max(
            1,
            Math.min(sensorCurrentPage, totalPages || 1)
        );
    }

    renderSensorTable();
}

// Search when the user types.
sensorSearch.addEventListener("input", applySensorFilters);

// Filter when the selected sensor type changes.
sensorTypeFilter.addEventListener("change", applySensorFilters);

// Change the number of rows displayed per page.
sensorRowsInput.addEventListener("change", () => {
    sensorRowsPerPage = Number(sensorRowsInput.value) || 10;
    sensorCurrentPage = 1;
    renderSensorTable();
});

// Load data when the page opens.
loadSensorData();

// Automatically refresh sensor records every 3 seconds.
setInterval(() => {
    loadSensorData(true);
}, 3000);