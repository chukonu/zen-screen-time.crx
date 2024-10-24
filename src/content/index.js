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

    try {
      const sendMessage = chrome.runtime
        ?.sendMessage({
          type: 'pulse',
          payload: { origin, startTime, duration },
        })
        .catch((err) =>
          console.debug('Error in sending message. Ignored silently. ', err),
        );

      if (!sendMessage) {
        console.debug('Runtime not available. Ignored.');
      }
    } catch (error) {
      // fix the error "Extension context invalidated."
      this.stop();
      console.info(
        '[Zen Screen Time] Stopped tracking screen time on this page due to an error in calling Chrome extension runtime. This might be fixed by reloading the page.',
      );
    }
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
