const SensorChart = (() => {
    const canvas = document.getElementById("sensorChart");
    const ctx = canvas ? canvas.getContext("2d") : null;

    let data = [];
    let selectedSensor = "all";
    let hoverIndex = -1;

    const padding = { top: 48, right: 82, bottom: 58, left: 82 };

    const sensorConfig = {
        temperature: {
            label: "Temperature",
            unit: "°C",
            color: "#f52222"
        },
        light: {
            label: "Light",
            unit: "Lux",
            color: "#f0d600"
        },
        humidity: {
            label: "Humidity",
            unit: "%",
            color: "#3b86e8"
        }
    };

    function getSelectedSensors() {
        return selectedSensor === "all"
            ? ["temperature", "light", "humidity"]
            : [selectedSensor];
    }

    function getSensorValues(sensor) {
        return data
            .filter(record =>
                record[sensor] !== null &&
                record[sensor] !== undefined &&
                record[sensor] !== "" &&
                Number.isFinite(Number(record[sensor]))
            )
            .map(record => Number(record[sensor]));
    }

    // Chọn bước trục theo các số dễ đọc: 1, 2, 5, 10, 20, 50...
    function getNiceStep(value) {
        if (!Number.isFinite(value) || value <= 0) return 1;

        const exponent = Math.floor(Math.log10(value));
        const fraction = value / Math.pow(10, exponent);

        let niceFraction;

        if (fraction <= 1) {
            niceFraction = 1;
        } else if (fraction <= 2) {
            niceFraction = 2;
        } else if (fraction <= 5) {
            niceFraction = 5;
        } else {
            niceFraction = 10;
        }

        return niceFraction * Math.pow(10, exponent);
    }

    // Tạo trục cho một cảm biến khi xem riêng.
    function getNiceAxis(values, sensor) {
        if (!values.length) {
            return { min: 0, max: 1, step: 0.2 };
        }

        if (
            sensor === "humidity" &&
            values.every(value => value >= 0 && value <= 100)
        ) {
            return { min: 0, max: 100, step: 20 };
        }

        if (sensor === "temperature" && values.every(value => value >= 0)) {
            const rawMax = Math.max(...values);
            const step = getNiceStep((rawMax || 1) / 5);
            const max = Math.max(
                step * 5,
                Math.ceil(rawMax / step) * step
            );

            return {
                min: 0,
                max,
                step: max / 5
            };
        }

        const rawMin = Math.min(...values);
        const rawMax = Math.max(...values);
        const range = rawMax - rawMin;

        if (range === 0) {
            const step = getNiceStep(Math.abs(rawMax) / 5 || 1);

            if (rawMin >= 0) {
                const min = Math.max(
                    0,
                    Math.floor(rawMin / step) * step - step
                );

                const max = Math.ceil(rawMax / step) * step + step;

                return {
                    min,
                    max: max > min ? max : min + step,
                    step
                };
            }

            return {
                min: rawMin - step,
                max: rawMax + step,
                step
            };
        }

        const step = getNiceStep(range / 5);
        const min = Math.floor(rawMin / step) * step;
        const max = Math.ceil(rawMax / step) * step;

        return {
            min,
            max: max > min ? max : min + step,
            step
        };
    }

    // Chế độ All Sensors:
    // Trục trái: nhiệt độ và độ ẩm dùng chung thang giá trị thật.
    // Trục phải: ánh sáng dùng thang Lux riêng.
    function getAllAxis(sensor) {
        if (sensor === "temperature" || sensor === "humidity") {
            return {
                min: 0,
                max: 100,
                step: 20
            };
        }

        return getNiceAxis(getSensorValues("light"), "light");
    }

    function getAxis(sensor) {
        const values = getSensorValues(sensor);

        if (!values.length) return null;

        return selectedSensor === "all"
            ? getAllAxis(sensor)
            : getNiceAxis(values, sensor);
    }

    // Chuyển giá trị thật thành tọa độ Y.
    function valueToY(value, axis, chartBottom, plotHeight) {
        if (!axis || axis.max === axis.min) {
            return chartBottom - plotHeight / 2;
        }

        return chartBottom -
            ((Number(value) - axis.min) / (axis.max - axis.min)) *
            plotHeight;
    }

    function redraw() {
        if (!canvas || !ctx) return;

        const ratio = window.devicePixelRatio || 1;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;

        if (!width || !height) return;

        canvas.width = width * ratio;
        canvas.height = height * ratio;

        ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
        ctx.clearRect(0, 0, width, height);

        if (!data.length) {
            ctx.fillStyle = "#999999";
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("No sensor data", width / 2, height / 2);
            return;
        }

        const left = padding.left;
        const right = width - padding.right;
        const top = padding.top;
        const bottom = height - padding.bottom;

        const plotWidth = right - left;
        const plotHeight = bottom - top;
        const sensors = getSelectedSensors();

        const getX = index => data.length === 1
            ? left + plotWidth / 2
            : left + (index / (data.length - 1)) * plotWidth;

        const allMode = selectedSensor === "all";

        // Trục chính dùng để vẽ lưới.
        const leftAxis = allMode
            ? getAllAxis("temperature")
            : getAxis(selectedSensor);

        const rightAxis = allMode
            ? getAllAxis("light")
            : selectedSensor === "light"
                ? getAxis("light")
                : null;

        drawGrid(left, right, top, bottom, leftAxis);
        drawAxes(left, right, top, bottom);
        drawXAxisLabels(bottom, getX);

        if (allMode) {
            // All Sensors: nhiệt độ và độ ẩm bên trái, ánh sáng bên phải.
            drawYAxisLabels(left, leftAxis);
            drawRightAxisLabels(right, rightAxis);

            drawAxisTitles(
                left,
                right,
                top,
                bottom,
                "Temperature (°C) & Humidity (%)",
                "Light (lux)"
            );
        } else {
            // Khi chọn riêng bất kỳ cảm biến nào, trục Y luôn nằm bên trái.
            drawYAxisLabels(left, leftAxis);

            const title = selectedSensor === "temperature"
                ? "Temperature (°C)"
                : selectedSensor === "humidity"
                    ? "Humidity (%)"
                    : "Light (lux)";

            drawAxisTitles(
                left,
                right,
                top,
                bottom,
                title,
                ""
            );
        }

        // Mỗi đường dùng đúng trục của cảm biến đó.
        sensors.forEach(sensor => {
            let axis;

            if (allMode) {
                axis = sensor === "light"
                    ? rightAxis
                    : leftAxis;
            } else {
                axis = selectedSensor === "light"
                    ? rightAxis
                    : leftAxis;
            }

            drawLine(sensor, axis, getX, bottom, plotHeight);
        });

        drawLegend(sensors, width, top);
        drawTooltip(sensors, getX, width, height);
    }

    // Vẽ các đường lưới ngang theo trục trái.
    function drawGrid(left, right, top, bottom, axis) {
        if (!axis) return;

        ctx.strokeStyle = "#eeeeee";
        ctx.lineWidth = 1;

        const divisions = Math.max(
            1,
            Math.round((axis.max - axis.min) / axis.step)
        );

        for (let i = 0; i <= divisions; i++) {
            const value = axis.min + i * axis.step;

            if (value > axis.max + axis.step / 2) break;

            const y = valueToY(
                value,
                axis,
                bottom,
                bottom - top
            );

            ctx.beginPath();
            ctx.moveTo(left, y);
            ctx.lineTo(right, y);
            ctx.stroke();
        }
    }

    // Vẽ khung biểu đồ và nhãn trục X.
    function drawAxes(left, right, top, bottom) {
        ctx.strokeStyle = "#999999";
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right, bottom);
        ctx.lineTo(right, top);
        ctx.stroke();

        ctx.fillStyle = "#666666";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Time", (left + right) / 2, bottom + 43);
    }

    // Chú thích trục Y bên trái và bên phải.
    // Chữ dùng màu trung tính, không phụ thuộc màu đường biểu diễn.
    function drawAxisTitles(left, right, top, bottom, leftTitle, rightTitle) {
        ctx.save();

        ctx.fillStyle = "#555555";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        if (leftTitle) {
            ctx.save();
            ctx.translate(20, (top + bottom) / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(leftTitle, 0, 0);
            ctx.restore();
        }

        if (rightTitle) {
            ctx.save();
            ctx.translate(canvas.clientWidth - 18, (top + bottom) / 2);
            ctx.rotate(Math.PI / 2);
            ctx.fillText(rightTitle, 0, 0);
            ctx.restore();
        }

        ctx.restore();
    }

    // Nhãn số trục trái: màu trung tính và dùng giá trị thật.
    function drawYAxisLabels(left, axis) {
        if (!axis) return;

        ctx.fillStyle = "#666666";
        ctx.font = "11px Arial";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        const bottom = canvas.clientHeight - padding.bottom;
        const plotHeight = bottom - padding.top;

        const divisions = Math.max(
            1,
            Math.round((axis.max - axis.min) / axis.step)
        );

        for (let i = 0; i <= divisions; i++) {
            const value = axis.min + i * axis.step;

            if (value > axis.max + axis.step / 2) break;

            const y = valueToY(value, axis, bottom, plotHeight);

            ctx.fillText(
                formatValue(value),
                left - 8,
                y
            );
        }
    }

    // Nhãn số trục phải: màu trung tính và dùng giá trị Lux thật.
    function drawRightAxisLabels(right, axis) {
        if (!axis) return;

        ctx.fillStyle = "#666666";
        ctx.font = "11px Arial";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";

        const bottom = canvas.clientHeight - padding.bottom;
        const plotHeight = bottom - padding.top;

        const divisions = Math.max(
            1,
            Math.round((axis.max - axis.min) / axis.step)
        );

        for (let i = 0; i <= divisions; i++) {
            const value = axis.min + i * axis.step;

            if (value > axis.max + axis.step / 2) break;

            const y = valueToY(value, axis, bottom, plotHeight);

            ctx.fillText(
                formatValue(value),
                right + 8,
                y
            );
        }
    }

    // Nhãn thời gian trên trục X.
    function drawXAxisLabels(bottom, getX) {
        ctx.fillStyle = "#666666";
        ctx.font = "11px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";

        const interval = Math.max(1, Math.ceil(data.length / 8));

        data.forEach((record, index) => {
            if (index % interval !== 0 && index !== data.length - 1) {
                return;
            }

            ctx.fillText(
                formatTime(record.time),
                getX(index),
                bottom + 20
            );
        });
    }

    // Vẽ đường cảm biến bằng giá trị thật, không chuẩn hóa dữ liệu.
    function drawLine(sensor, axis, getX, bottom, plotHeight) {
        const config = sensorConfig[sensor];

        if (!config || !axis) return;

        ctx.strokeStyle = config.color;
        ctx.fillStyle = config.color;
        ctx.lineWidth = 2;
        ctx.lineJoin = "round";
        ctx.lineCap = "round";

        let drawing = false;

        ctx.beginPath();

        data.forEach((record, index) => {
            const raw = record[sensor];

            if (
                raw === null ||
                raw === undefined ||
                raw === "" ||
                !Number.isFinite(Number(raw))
            ) {
                drawing = false;
                return;
            }

            const x = getX(index);
            const y = valueToY(
                Number(raw),
                axis,
                bottom,
                plotHeight
            );

            if (!drawing) {
                ctx.moveTo(x, y);
                drawing = true;
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Vẽ điểm dữ liệu trên đường.
        data.forEach((record, index) => {
            const raw = record[sensor];

            if (
                raw === null ||
                raw === undefined ||
                raw === "" ||
                !Number.isFinite(Number(raw))
            ) {
                return;
            }

            ctx.beginPath();

            ctx.arc(
                getX(index),
                valueToY(Number(raw), axis, bottom, plotHeight),
                index === hoverIndex ? 5 : 3,
                0,
                Math.PI * 2
            );

            ctx.fill();
        });
    }

    // Legend giữ màu riêng cho từng cảm biến.
    function drawLegend(sensors, width, top) {
        ctx.font = "11px Arial";
        ctx.textBaseline = "alphabetic";

        const labels = sensors.map(sensor =>
            selectedSensor === "all"
                ? `${sensorConfig[sensor].label} (${sensorConfig[sensor].unit})`
                : sensorConfig[sensor].label
        );

        const widths = labels.map(label =>
            12 + 7 + ctx.measureText(label).width + 16
        );

        const total = widths.reduce((sum, item) => sum + item, 0);

        let x = Math.max(5, (width - total) / 2);

        sensors.forEach((sensor, index) => {
            ctx.fillStyle = sensorConfig[sensor].color;
            ctx.fillRect(x, top - 10, 12, 3);

            ctx.fillStyle = "#555555";
            ctx.textAlign = "left";

            ctx.fillText(
                labels[index],
                x + 19,
                top - 6
            );

            x += widths[index];
        });
    }

    // Tooltip hiển thị giá trị thật của các cảm biến tại thời điểm chọn.
    function drawTooltip(sensors, getX, width, height) {
        if (hoverIndex < 0 || hoverIndex >= data.length) return;

        const record = data[hoverIndex];

        const items = [
            `Time: ${formatDateTime(record.time)}`
        ];

        sensors.forEach(sensor => {
            const value = record[sensor];

            if (
                value !== null &&
                value !== undefined &&
                value !== "" &&
                Number.isFinite(Number(value))
            ) {
                items.push(
                    `${sensorConfig[sensor].label}: ${formatValue(Number(value))} ${sensorConfig[sensor].unit}`
                );
            }
        });

        ctx.font = "12px Arial";

        const tooltipWidth =
            Math.max(...items.map(item => ctx.measureText(item).width)) + 20;

        const tooltipHeight = items.length * 18 + 14;
        const pointX = getX(hoverIndex);

        let x = pointX + 12;

        if (x + tooltipWidth > width - 4) {
            x = pointX - tooltipWidth - 12;
        }

        x = Math.max(
            4,
            Math.min(x, width - tooltipWidth - 4)
        );

        let y = padding.top + 5;

        if (y + tooltipHeight > height - 4) {
            y = Math.max(4, height - tooltipHeight - 4);
        }

        ctx.fillStyle = "rgba(40,40,40,0.92)";
        ctx.beginPath();

        if (typeof ctx.roundRect === "function") {
            ctx.roundRect(x, y, tooltipWidth, tooltipHeight, 5);
        } else {
            ctx.rect(x, y, tooltipWidth, tooltipHeight);
        }

        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";

        items.forEach((item, index) => {
            ctx.fillText(
                item,
                x + 10,
                y + 17 + index * 18
            );
        });
    }

    function formatTime(time) {
        if (!time) return "";

        const match = String(time).match(/(\d{2}):(\d{2})/);

        return match
            ? `${match[1]}:${match[2]}`
            : String(time);
    }

    function formatDateTime(time) {
        if (!time) return "Unknown time";

        const value = String(time);

        const iso = value.match(
            /^(\d{4})-(\d{2})-(\d{2})T?(\d{2}):(\d{2}):(\d{2})/
        );

        if (iso) {
            return `${iso[3]}/${iso[2]}/${iso[1]} ${iso[4]}:${iso[5]}:${iso[6]}`;
        }

        const local = value.match(
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/
        );

        if (local) {
            return `${local[1].padStart(2, "0")}/${local[2].padStart(2, "0")}/${local[3]} ${local[4]}:${local[5]}:${local[6]}`;
        }

        return value;
    }

    function formatValue(value) {
        const number = Number(value);

        if (!Number.isFinite(number)) return "";

        return Number.isInteger(number)
            ? String(number)
            : number.toFixed(1);
    }

    // Tìm điểm gần vị trí chuột nhất để hiển thị tooltip.
    function findHoverPoint(mouseX, mouseY) {
        if (!data.length || !canvas) return -1;

        const left = padding.left;
        const right = canvas.clientWidth - padding.right;
        const top = padding.top;
        const bottom = canvas.clientHeight - padding.bottom;

        const plotWidth = right - left;
        const plotHeight = bottom - top;

        const sensors = getSelectedSensors();

        const getX = index => data.length === 1
            ? left + plotWidth / 2
            : left + (index / (data.length - 1)) * plotWidth;

        let closestIndex = -1;
        let closestDistance = 12;

        data.forEach((record, index) => {
            const x = getX(index);

            sensors.forEach(sensor => {
                const raw = record[sensor];

                if (
                    raw === null ||
                    raw === undefined ||
                    raw === "" ||
                    !Number.isFinite(Number(raw))
                ) {
                    return;
                }

                let axis;

                if (selectedSensor === "all") {
                    axis = sensor === "light"
                        ? getAllAxis("light")
                        : getAllAxis(sensor);
                } else {
                    axis = getAxis(sensor);
                }

                if (!axis) return;

                const y = valueToY(
                    Number(raw),
                    axis,
                    bottom,
                    plotHeight
                );

                const distance = Math.hypot(
                    mouseX - x,
                    mouseY - y
                );

                if (distance <= closestDistance) {
                    closestDistance = distance;
                    closestIndex = index;
                }
            });
        });

        return closestIndex;
    }

    function handleMouseMove(event) {
        if (!canvas || !data.length) return;

        const rect = canvas.getBoundingClientRect();

        const nextIndex = findHoverPoint(
            event.clientX - rect.left,
            event.clientY - rect.top
        );

        if (nextIndex !== hoverIndex) {
            hoverIndex = nextIndex;

            canvas.style.cursor = hoverIndex >= 0
                ? "pointer"
                : "default";

            redraw();
        }
    }

    function handleMouseLeave() {
        if (hoverIndex !== -1) {
            hoverIndex = -1;

            if (canvas) {
                canvas.style.cursor = "default";
            }

            redraw();
        }
    }

    // Nhận dữ liệu mới, chỉ giữ tối đa 15 điểm.
    function setData(newData) {
        data = Array.isArray(newData)
            ? newData.slice(-15)
            : [];

        hoverIndex = -1;
        redraw();
    }

    // Thêm một điểm dữ liệu mới.
    function addPoint(point) {
        if (!point) return;

        data = [...data, point].slice(-15);

        hoverIndex = -1;
        redraw();
    }

    // Chọn All Sensors hoặc một loại cảm biến.
    function setSensor(sensor) {
        const valid = [
            "all",
            "temperature",
            "light",
            "humidity"
        ];

        selectedSensor = valid.includes(sensor)
            ? sensor
            : "all";

        hoverIndex = -1;
        redraw();
    }

    if (canvas) {
        canvas.addEventListener("mousemove", handleMouseMove);
        canvas.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("resize", redraw);
    }

    return {
        setData,
        addPoint,
        setSensor,
        redraw
    };
})();