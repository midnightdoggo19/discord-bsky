const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Collection,
} = require('discord.js');

const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config()
const { BskyAgent } = require('@atproto/api');
const { logger } = require('./functions.js')

const client = new Client({
  intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
  ]
});

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

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

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			logger.warn(` The command at ${filePath} is missing a required "data" or "execute" property.`);
		};
	};
};

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  logger.error('Missing TOKEN or CLIENT_ID in the environment variables.');
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN).then(() => {
    logger.info('Discord bot is online!');
}).catch(err => {
    logger.error('Error logging into Discord:', err);
});

process.on('SIGINT', function() {
    logger.info(`\nCaught interrupt signal, shutting down!`);
    process.exit();
});

client.login(process.env.DISCORD_TOKEN);
module.exports = { bskyAgent }