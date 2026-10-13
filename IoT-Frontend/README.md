# IoT Frontend

Frontend for the IoT project.

## Technology

- HTML
- CSS
- JavaScript
- Future backend: Java Spring Boot
- Future IoT communication: MQTT + ESP32
- Future realtime communication: WebSocket

## Open the interface

The project is intentionally designed so the HTML pages can be
opened directly in Chrome/Edge without starting Spring Boot.

Open:

- `index.html`
- `pages/dashboard.html`
- `pages/datasensor.html`
- `pages/history.html`
- `pages/profile.html`

## Current state

The UI follows the supplied Figma screenshots. Datasensor and History keep their pagination controls visible and disabled while there is no data.

The frontend is currently independent of the backend.

Sensor values, sensor table records and history records are empty
because the backend has not been connected yet.

Device switches work visually and currently call a placeholder
service.

## Future connection points

### REST API

Edit:

`js/services/api.js`

This will later communicate with Java Spring Boot.

### WebSocket

Edit:

`js/services/websocket.js`

The intended flow is:

ESP32 -> MQTT -> Spring Boot -> WebSocket -> Browser

### Device control

The Dashboard calls:

`ApiService.controlDevice(device, status)`

Later this will become a Spring Boot API request, and the backend
will publish the corresponding MQTT command.

## Profile photo

Replace:

`assets/images/profile.jpg`

with your own photo while keeping the same filename.
