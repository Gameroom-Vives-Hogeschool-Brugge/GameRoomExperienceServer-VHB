var mqtt = require("mqtt");
const dotenv = require("dotenv");

//load the environment variables
dotenv.config({
  path: "./keys.env",
});

//mqtt
class MqttHandler {
  constructor() {
    this.mqttClient = null;
    this.switchTopic = process.env.SHELLY_ID + "/command/switch:0";
    this.commandTopic = process.env.SHELLY_ID + "/command";
    this.statusTopic = process.env.SHELLY_ID + "/status/switch:0";
  }

  connect() {
    // Connect mqtt with credentials (in case of needed, otherwise we can omit 2nd param)
    this.mqttClient = mqtt.connect(process.env.MQTT_HOST, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
    });

    // Mqtt error calback
    this.mqttClient.on("error", (err) => {
      console.log(err);
      this.mqttClient.end();
    });

    // Connection callback
    this.mqttClient.on("connect", () => {
      console.log(`mqtt client connected`);
    });

    // mqtt subscriptions
    this.mqttClient.subscribe(this.statusTopic, { qos: 1 })

    // When a message arrives, console.log it
    this.mqttClient.on("message", function (topic, message) {
      console.log(message.toString());
    });

    this.mqttClient.on("close", () => {
      console.log(`mqtt client disconnected`);
    });
  }

  // Sends a mqtt message to topic: mytopic
  sendMessage(topic, message) {
    const result = this.mqttClient.publish(topic, message, { qos: 1 });
    return result;
  }
}

module.exports = MqttHandler;
