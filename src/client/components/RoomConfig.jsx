import React from 'react';
import { cloneDeep } from 'lodash';

import StoreProvider from '../lib/store';

import styles from './Config.css';

export default class RoomConfig extends React.Component {
  static contextType = StoreProvider;

  constructor(props) {
    super(props);

    this.state = cloneDeep(props.value);
    this.presets = {
      simple: [{ start: 0, end: 24, temp: 20 }],
      day: [
        { start: 0, end: 9, temp: 15 },
        { start: 9, end: 18, temp: 19 },
        { start: 18, end: 24, temp: 20 },
      ],
      sleep: [
        { start: 0, end: 4, temp: 20.7 },
        { start: 4, end: 9, temp: 21 },
        { start: 9, end: 18, temp: 15 },
        { start: 18, end: 24, temp: 20.5 },
      ],
    };
  }

  render() {
    if (!this.state.tempGroups) {
      return null;
    }

    const tempGroups = this.state.tempGroups.map((item, key) => {
      const value = item.temp;
      return (
        <div className={styles.tempGroup} key={key}>
          <div>
            {item.start} - {item.end} hs.
          </div>
          <div className={styles.tempGroupControls}>
            <input
              type="number"
              min="10"
              max="30"
              step="0.5"
              value={item.temp}
              onChange={(e) => this.handleTempChange(key, e.target.value)}
            />
            <div className={styles.tempGroupButtons}>
              <button
                className={styles.tempControlButton}
                onClick={(e) => this.handleTempChange(key, value + 0.5)}
              >
                ⬆︎
              </button>
              <button
                className={styles.tempControlButton}
                onClick={(e) => this.handleTempChange(key, value - 0.5)}
              >
                ⬇︎
              </button>
            </div>
          </div>
        </div>
      );
    });

    return (
      <section className={styles.root}>
        <div className={styles.content}>
          <p>Set desired set point for each time frame:</p>
          <div className={styles.presets}>
            <label>Presets: </label>
            <button
              className={styles.presetBtn}
              onClick={() => this.onPresetClick('simple')}
            >
              Simple
            </button>
            <button
              className={styles.presetBtn}
              onClick={() => this.onPresetClick('day')}
            >
              Day
            </button>
            <button
              className={styles.presetBtn}
              onClick={() => this.onPresetClick('sleep')}
            >
              Sleep
            </button>
          </div>
          <div className={styles.tempGroups}>{tempGroups}</div>
        </div>
        <div className={styles.content}>
          <label>Threshold: </label>
          <input
            type="number"
            min="0.1"
            max="2"
            step="0.1"
            value={this.state.threshold}
            onChange={(e) =>
              this.setState({ threshold: Number(e.target.value) })
            }
          />
        </div>
        <div className={styles.controls}>
          <button className={styles.saveBtn} onClick={() => this.save()}>
            Save
          </button>
          <button className={styles.cancelBtn} onClick={() => history.back()}>
            Back
          </button>
        </div>
      </section>
    );
  }

  setNightTime(value) {
    this.setState({ nightTime: value === true ? null : value });
  }

  async save() {
    await this.props.onSave(this.state);
    history.back();
  }

  onPresetClick(name) {
    this.setState({
      tempGroups: cloneDeep(this.presets[name]),
    });
  }

  handleTempChange(key, value) {
    this.setState((prevState) => {
      const tempGroups = prevState.tempGroups;
      prevState.tempGroups[key].temp = Number(value);
      return { tempGroups };
    });
  }
}
