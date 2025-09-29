// logger.js
let logCounter = 0;

const logger = {
  log: (...args) => {
    // Development: loguj sve
    if (process.env.NODE_ENV !== 'production') {
      logger.log(...args);
      return;
    }

    // Production: loguj samo 1 od 50 puta
    logCounter++;
    if (logCounter % 50 === 0) {
      logger.log(...args);
    }
  },

  error: (...args) => {
    // Greške uvek loguj, i u produkciji
    logger.error(...args);
  },

  info: (...args) => {
    // Informacije: loguj samo u dev ili retko u prod
    if (process.env.NODE_ENV !== 'production') {
      console.info(...args);
    }
  }
};

module.exports = logger;
