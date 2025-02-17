const winston = require('winston');
require('dotenv').config();
const { BskyAgent } = require('@atproto/api');

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

const bskyAgent = new BskyAgent({
    service: process.env.PDS || "https://bsky.social", // default to the default if there is not a pds provided
});

bskyAgent.login({
    // set in .env
    identifier: process.env.BLUESKY_HANDLE,
    password: process.env.BLUESKY_PASSWORD,
}).catch(err => {
    logger.error('Error logging into Bluesky:', err);
});

module.exports = { logger, bskyAgent }