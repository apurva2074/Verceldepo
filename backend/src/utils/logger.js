const isDev = process.env.NODE_ENV !== 'production';
const logger = {
  log: (...args) => isDev && console.log(...args),
  error: (...args) => console.error(...args),  // always log errors
  warn: (...args) => console.warn(...args),
};
module.exports = logger;
