let logCounter = 0;

 console.log = {
  log: (...args) => {
    // Development: loguj sve
    if (process.env.NODE_ENV !== 'production') {
      console.log(...args); // ✅ console.log, ne console.log
      return;
    }

    // Production: loguj samo 1 od 50 puta
    logCounter++;
    if (logCounter % 50 === 0) {
      console.log(...args); // ✅ console.log
    }
  },

  error: (...args) => {
    // Greške uvek loguj, i u produkciji
    console.error(...args); // ✅ console.error
  },

  info: (...args) => {
    // Informacije: loguj samo u dev
    if (process.env.NODE_ENV !== 'production') {
      console.info(...args); // ✅ console.info
    }
  }
};

module.exports = console.log;
