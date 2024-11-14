function noop() {}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    let result;

    try {
      result = chrome?.runtime?.sendMessage(message);
    } catch (error) {
      reject(error);
      return;
    }

    if (!result) {
      reject(new Error('No runtime is available for sending the message.'));
      return;
    }

    result.then((response) => {
      if (!arguments.length) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

class Pulse {
  #isStarted = false;
  #timeoutId = null;
  #interval;

  constructor(interval = Pulse.#oneSecond) {
    this.#interval = interval;
  }

  start() {
    if (!this.#isStarted) {
      this.#pulse();
      this.#isStarted = true;
    }
  }

  stop() {
    if (this.#isStarted && this.#timeoutId) {
      clearTimeout(this.#timeoutId);
      this.#reset();
    }
  }

  #reset() {
    this.#timeoutId = null;
    this.#isStarted = false;
  }

  #pulse() {
    this.#timeoutId = setTimeout(() => {
      this.#report();

      // check isStarted in case stop() has just been called
      if (this.#isStarted) {
        this.#pulse();
      }
    }, this.#interval);
  }

  #report() {
    const origin = document.location.origin;
    const startTime = Date.now();
    const duration = this.#interval / 1000;

    const message = {
      type: 'pulse',
      payload: { origin, startTime, duration },
    };

    sendMessage(message)
      .then(noop)
      .catch((err) => {
        console.debug(`While sending a pulse: ${err.message}`);

        this.stop();
        console.debug('Stopped reporting pulses.');
      });
  }

  static #oneSecond = 1000;
}

const pulse = new Pulse();

const startStop = () => {
  if (document.visibilityState === 'visible') {
    pulse.start();
  } else {
    pulse.stop();
  }
};

document.addEventListener('visibilitychange', startStop);

if (document.visibilityState === 'visible') {
  pulse.start();
}

// temporary
const litmitCheck = setInterval(() => {
  const message = {
    type: 'limit_check',
  };
  sendMessage(message)
    .then((response) => console.debug('limit check: ', response))
    .catch((err) => {
      console.debug(`While checking for limits: ${err.message}`);

      clearInterval(litmitCheck);
      console.debug('Stopped limit checking.');
    });
}, 20 * 1000);
