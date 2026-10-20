
#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <time.h>

// ================= WIFI =================
const char* ssid = "Thuy Dung Vu";
const char* password = "dthyfu73";

// ================= MQTT =================
const char* mqtt_server = "172.20.10.2";
const int mqtt_port = 1883;

const char* mqtt_user = "thuydungvu";
const char* mqtt_password = "123456";

// ================= MQTT TOPIC =================
const char* topic_sensor = "esp32/sensor-data";
const char* topic_control = "esp32/device-control";
const char* topic_status = "esp32/device-status";

// ================= DHT11 =================
#define DHTPIN 4
#define DHTTYPE DHT11

// ================= LDR =================
#define LDR_PIN 34

// ================= LED =================
#define LED_RED 25
#define LED_GREEN 26
#define LED_YELLOW 27

DHT dht(DHTPIN, DHTTYPE);

WiFiClient espClient;
PubSubClient client(espClient);

// =================================================
// WIFI
// =================================================

void setup_wifi() {
    Serial.println();
    Serial.print("Dang ket noi WiFi: ");
    Serial.println(ssid);

    WiFi.begin(ssid, password);

    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }

    Serial.println();
    Serial.println("WiFi da ket noi!");

    Serial.print("IP ESP32: ");
    Serial.println(WiFi.localIP());
}

// =================================================
// DONG BO THOI GIAN VIET NAM
// =================================================

void setup_time() {
    configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");

    Serial.println("Dang dong bo thoi gian...");

    struct tm timeinfo;

    while (!getLocalTime(&timeinfo)) {
        Serial.print(".");
        delay(500);
    }

    Serial.println();
    Serial.println("Dong bo thoi gian thanh cong!");

    char timeString[25];

    strftime(
        timeString,
        sizeof(timeString),
        "%d/%m/%Y %H:%M:%S",
        &timeinfo
    );

    Serial.print("Thoi gian hien tai: ");
    Serial.println(timeString);
}

// =================================================
// GUI TRANG THAI LED QUA MQTT
// =================================================

void publishDeviceStatus(const char* ledName, const char* status) {
    char statusMessage[40];

    snprintf(
        statusMessage,
        sizeof(statusMessage),
        "{\"%s\":\"%s\"}",
        ledName,
        status
    );

    if (client.publish(topic_status, statusMessage)) {
        Serial.print("Da gui xac nhan: ");
        Serial.println(statusMessage);
    } else {
        Serial.println("Loi gui xac nhan MQTT!");
    }
}

// =================================================
// MQTT CALLBACK - NHAN LENH DIEU KHIEN
// =================================================

void callback(char* topic, byte* payload, unsigned int length) {
    String message = "";

    for (unsigned int i = 0; i < length; i++) {
        message += (char)payload[i];
    }

    message.replace(" ", "");

    Serial.println();
    Serial.println("===== MQTT CONTROL =====");

    Serial.print("Topic: ");
    Serial.println(topic);

    Serial.print("Message: ");
    Serial.println(message);

    if (String(topic) != topic_control) {
        return;
    }

    const char* ledName = nullptr;
    const char* ledStatus = nullptr;

    // LED 1 - DO
    if (message.indexOf("\"led1\":\"on\"") >= 0) {
        digitalWrite(LED_RED, HIGH);

        ledName = "led1";
        ledStatus = "on";

        Serial.println("LED DO: ON");
    }
    else if (message.indexOf("\"led1\":\"off\"") >= 0) {
        digitalWrite(LED_RED, LOW);

        ledName = "led1";
        ledStatus = "off";

        Serial.println("LED DO: OFF");
    }

    // LED 2 - XANH
    else if (message.indexOf("\"led2\":\"on\"") >= 0) {
        digitalWrite(LED_GREEN, HIGH);

        ledName = "led2";
        ledStatus = "on";

        Serial.println("LED XANH: ON");
    }
    else if (message.indexOf("\"led2\":\"off\"") >= 0) {
        digitalWrite(LED_GREEN, LOW);

        ledName = "led2";
        ledStatus = "off";

        Serial.println("LED XANH: OFF");
    }

    // LED 3 - VANG
    else if (message.indexOf("\"led3\":\"on\"") >= 0) {
        digitalWrite(LED_YELLOW, HIGH);

        ledName = "led3";
        ledStatus = "on";

        Serial.println("LED VANG: ON");
    }
    else if (message.indexOf("\"led3\":\"off\"") >= 0) {
        digitalWrite(LED_YELLOW, LOW);

        ledName = "led3";
        ledStatus = "off";

        Serial.println("LED VANG: OFF");
    }

    // Gui xac nhan sau khi thuc hien lenh
    if (ledName != nullptr && ledStatus != nullptr) {
        publishDeviceStatus(ledName, ledStatus);
    } else {
        Serial.println("Lenh dieu khien khong hop le!");
    }
}

// =================================================
// MQTT RECONNECT
// =================================================

void reconnect() {
    while (!client.connected()) {
        Serial.print("Dang ket noi MQTT...");

        String clientId = "thuydungvu-ESP32-";
        clientId += String(random(0xffff), HEX);

        if (client.connect(
                clientId.c_str(),
                mqtt_user,
                mqtt_password
            )) {

            Serial.println("Da ket noi MQTT!");

            client.subscribe(topic_control);

            Serial.print("Da subscribe: ");
            Serial.println(topic_control);

        } else {
            Serial.print("That bai, rc=");
            Serial.print(client.state());
            Serial.println(" - thu lai sau 5 giay");

            delay(5000);
        }
    }
}

// =================================================
// SETUP
// =================================================

void setup() {
    Serial.begin(115200);

    // Cam bien DHT11
    dht.begin();

    // Cam bien anh sang LDR
    pinMode(LDR_PIN, INPUT);

    // LED
    pinMode(LED_RED, OUTPUT);
    pinMode(LED_GREEN, OUTPUT);
    pinMode(LED_YELLOW, OUTPUT);

    // Tat LED khi khoi dong
    digitalWrite(LED_RED, LOW);
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, LOW);

    // Ket noi WiFi
    setup_wifi();

    // Dong bo thoi gian
    setup_time();

    // Cau hinh MQTT
    client.setServer(mqtt_server, mqtt_port);
    client.setCallback(callback);
}

// =================================================
// LOOP
// =================================================

void loop() {
    if (!client.connected()) {
        reconnect();
    }

    client.loop();

    // ================= DOC CAM BIEN =================

    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();

    int light = 4095 - analogRead(LDR_PIN);

    if (isnan(temperature) || isnan(humidity)) {
        Serial.println("Loi doc DHT11!");
    } else {
        // ================= LAY THOI GIAN =================

        struct tm timeinfo;

        if (!getLocalTime(&timeinfo)) {
            Serial.println("Khong lay duoc thoi gian!");
        } else {
            char timeString[25];

            strftime(
                timeString,
                sizeof(timeString),
                "%d/%m/%Y %H:%M:%S",
                &timeinfo
            );

            // ================= HIEN THI =================

            Serial.println();
            Serial.println("===== SENSOR DATA =====");

            Serial.print("Thoi gian: ");
            Serial.println(timeString);

            Serial.print("Nhiet do: ");
            Serial.print(temperature);
            Serial.println(" C");

            Serial.print("Do am: ");
            Serial.print(humidity);
            Serial.println(" %");

            Serial.print("Anh sang: ");
            Serial.println(light);

            // ================= TAO JSON =================

            char data[200];

            snprintf(
                data,
                sizeof(data),
                "{\"time\":\"%s\",\"temperature\":%.2f,\"humidity\":%.2f,\"light\":%d}",
                timeString,
                temperature,
                humidity,
                light
            );

            // ================= GUI DU LIEU CAM BIEN =================

            if (client.publish(topic_sensor, data)) {
                Serial.print("Published: ");
                Serial.println(data);
            } else {
                Serial.println("Publish that bai!");
            }
        }
    }

    delay(2000);
}
