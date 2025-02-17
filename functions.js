const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
    level: process.env.LOGLEVEL || 'info',
    format: winston.format.combine(
          winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          winston.format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
    ),
    transports: [
          new winston.transports.Console(),
          new winston.transports.File({ filename: process.env.LOGFILE || 'bsky.log' }),
    ]
});

module.exports = { logger }