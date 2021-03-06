const { createLogger, format, transports } = require('winston');
const { Writable } = require('stream');
const mqttClient = require('./mqtt/client');

const { combine, splat } = format;

class MqttStream extends Writable {
  constructor(options) {
    super(options);
    this.mqttClient = mqttClient;
  }

  _write(obj, encoding, callback) {
    this.mqttClient.publish('stat/_logs', JSON.stringify(obj), {
      qos: 0,
    });
    callback();
  }
}

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(splat(), format.json()),
  transports: [
    new transports.Console(),
    new transports.Stream({
      stream: new MqttStream({ objectMode: true }),
      level: 'debug',
    }),
  ],
});

module.exports = logger;
