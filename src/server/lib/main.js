const Feels = require('feels');
const logger = require('winston');
const { getWeather } = require('./weather');
const db = require('./db');
const topics = require('./mqtt/topics');
const mqttClient = require('./mqtt/client');

function getRealFeel(temperature, humidity) {
  const feelsLike = new Feels({
    temp: temperature,
    humidity,
    speed: 0
  }).like();

  // Round to one decimal
  return Math.round(feelsLike * 10) / 10;
}

async function updateHeaterState() {
  logger.debug(`updateHeaterState()`);

  const sensor = await db.getHeaterSensor();
  const state = await db.getHeaterState();

  if (!sensor || !state) {
    logger.error(`not enough data! skipping...`);
    return;
  }

  const heaterConfig = await db.getHeaterConfig();
  const { defaultTriggerTemp, tempGroups, minStateDurationSecs } = heaterConfig;

  const currentHour = new Date().getHours();
  const currentTempGroup = tempGroups.find(entry => currentHour >= entry.start && currentHour < entry.end);

  const triggerTemp = currentTempGroup ? currentTempGroup.temp : defaultTriggerTemp;

  logger.debug('trigger temp:', triggerTemp);

  // calculate how long the device has been in this state
  const stateDurationSecs = Math.round((Date.now() - state.lastChange) / 1000);

  logger.info(`last state change was ${stateDurationSecs} seconds ago`);

  // keep the same state for at least 15 minutes
  if (stateDurationSecs < minStateDurationSecs) {
    logger.info(`skipping...`);
    return;
  }

  const realFeel = sensor.realFeel;

  if (!state.on && realFeel < triggerTemp) {
    logger.info('turning device on...');
    mqttClient.publish(topics.heater.cmnd, '1');
  }

  if (state.on && realFeel >= (triggerTemp + 0.5)) {
    logger.info('turning device off...');
    mqttClient.publish(topics.heater.cmnd, '0');
  }
}

async function updateReport() {
  logger.debug(`updateCustomReport()`);

  const heaterSensor = await db.getHeaterSensor();
  const loungeSensor = await db.getSensorData('wemos1');

  let report = {
    room: heaterSensor,
    lounge: loungeSensor
  };

  try {
    const weather = await getWeather();

    Object.assign(report, {
      weather: {
        temperature: Math.round(weather.main.temp * 10) / 10,
        humidity: weather.main.humidity,
        windSpeedKmh: Math.round(weather.wind.speed / 1000 * 3600)
      }
    });
  } catch (err) {
    logger.error('error parsing weather report');
  }

  logger.info('custom report:', report);

  mqttClient.publish(topics.report, JSON.stringify(report), { retain: true });

  await db.set('report', JSON.stringify(report));
}

exports.updateHeaterState = updateHeaterState;
exports.updateReport = updateReport;
exports.getRealFeel = getRealFeel;
