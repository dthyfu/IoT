
// Store history records.
let allHistoryRecords = [];
let historyRecords = [];
let historyCurrentPage = 1;
let historyRowsPerPage = 10;
let historyLoadError = false;

// Get HTML elements.
const historySearch = document.getElementById("historySearch");
const historyDeviceFilter = document.getElementById("historyDeviceFilter");
const historyActionFilter = document.getElementById("historyActionFilter");
const historyStatusFilter = document.getElementById("historyStatusFilter");
const historyRowsInput = document.getElementById("historyRowsPerPage");
const historyTableBody = document.getElementById("historyTableBody");
const historyPagination = document.getElementById("historyPagination");
const historyTotal = document.getElementById("historyTotal");

// Spring Boot API.
const HISTORY_API_URL = "http://localhost:8080/api/history";

// Format time as dd/MM/yyyy HH:mm:ss.
function formatHistoryTime(time) {
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

// Normalize values to compare without case sensitivity.
function normalize(value) {
    return String(value ?? "").trim().toLowerCase();
}

// Show a message inside the table.
function showHistoryMessage(message) {
    historyTableBody.innerHTML = "";

    const row = document.createElement("tr");
    row.style.height = "100px";

    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = message;
    cell.style.color = "#999999";
    cell.style.fontStyle = "italic";

    row.appendChild(cell);
    historyTableBody.appendChild(row);

    historyTotal.textContent = "Results: 0 of 0";
    renderPagination(historyPagination, 1, 0, () => {});
}

// Load real history data from Spring Boot.
async function loadHistoryData() {
    try {
        const response = await fetch(HISTORY_API_URL);

        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("The API response is not an array.");
        }

        // Convert backend field names to frontend field names.
        allHistoryRecords = data.map(record => ({
            id: record.id ?? "",
            deviceName: record.device_name ?? record.deviceName ?? "",
            action: record.action ?? "",
            deviceStatus: record.device_status ?? record.deviceStatus ?? "",
            performedBy: record.performed_by ?? record.performedBy ?? "",
            time: record.time ?? record.requested_at ?? ""
        }));

        historyLoadError = false;
        applyHistoryFilters();

    } catch (error) {
        console.error("Failed to load history:", error);

        historyLoadError = true;
        allHistoryRecords = [];
        historyRecords = [];

        showHistoryMessage(
            "Unable to load history. Please check Spring Boot and try again."
        );
    }
}

// Render the current page of history.
function renderHistoryTable() {
    if (historyLoadError) {
        return;
    }

    historyTableBody.innerHTML = "";

    if (historyRecords.length === 0) {
        showHistoryMessage("No history data");
        return;
    }

    const start = (historyCurrentPage - 1) * historyRowsPerPage;
    const end = start + historyRowsPerPage;
    const pageRecords = historyRecords.slice(start, end);

    pageRecords.forEach(record => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHtml(record.id)}</td>
            <td>${escapeHtml(record.deviceName)}</td>
            <td>${escapeHtml(record.action)}</td>
            <td>${escapeHtml(record.deviceStatus)}</td>
            <td>${escapeHtml(record.performedBy || "-")}</td>
            <td>${escapeHtml(formatHistoryTime(record.time))}</td>
        `;

        historyTableBody.appendChild(row);
    });

    const firstRecord = start + 1;
    const lastRecord = Math.min(end, historyRecords.length);

    historyTotal.textContent =
        `Results: ${firstRecord}-${lastRecord} of ${historyRecords.length}`;

    const totalPages = Math.ceil(historyRecords.length / historyRowsPerPage);

    // Reuse the existing pagination.js function.
    renderPagination(
        historyPagination,
        historyCurrentPage,
        totalPages,
        page => {
            historyCurrentPage = page;
            renderHistoryTable();
        }
    );
}

// Apply search and filters.
function applyHistoryFilters() {
    if (historyLoadError) {
        return;
    }

    const keyword = normalize(historySearch.value);
    const selectedDevice = normalize(historyDeviceFilter.value || "all");
    const selectedAction = normalize(historyActionFilter.value || "all");
    const selectedStatus = normalize(historyStatusFilter.value || "all");

    historyRecords = allHistoryRecords.filter(record => {
        const formattedTime = formatHistoryTime(record.time);

        // Search by time, as specified in the HTML placeholder.
        const matchesKeyword =
            keyword === "" ||
            normalize(record.time).includes(keyword) ||
            normalize(formattedTime).includes(keyword);

        const matchesDevice =
            selectedDevice === "all" ||
            normalize(record.deviceName) === selectedDevice;

        const matchesAction =
            selectedAction === "all" ||
            normalize(record.action) === selectedAction;

        const matchesStatus =
            selectedStatus === "all" ||
            normalize(record.deviceStatus) === selectedStatus;

        return (
            matchesKeyword &&
            matchesDevice &&
            matchesAction &&
            matchesStatus
        );
    });

    historyCurrentPage = 1;
    renderHistoryTable();
}

// Search history by time.
historySearch.addEventListener("input", applyHistoryFilters);

// Filter by device name.
historyDeviceFilter.addEventListener("change", applyHistoryFilters);

// Filter by action.
historyActionFilter.addEventListener("change", applyHistoryFilters);

// Filter by device status.
historyStatusFilter.addEventListener("change", applyHistoryFilters);

// Change rows per page.
historyRowsInput.addEventListener("change", () => {
    historyRowsPerPage = Number(historyRowsInput.value) || 10;
    historyCurrentPage = 1;
    renderHistoryTable();
});

// Load history when the page opens.
loadHistoryData();