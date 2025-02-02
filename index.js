const { 
  Client, 
  GatewayIntentBits, 
  REST, 
  Routes, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder, 
  Events 
} = require('discord.js');

const winston = require('winston');
require('dotenv').config();
const { BskyAgent } = require('@atproto/api');

const client = new Client({
  intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
  ]
});

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

const bskyAgent = new BskyAgent({
  service: process.env.PDS || "https://bsky.social", // default to the default if there is not a pds provided
});

const logger = winston.createLogger({
  level: process.env.LOGLEVEL || 'info',
  format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => `[${info.timestamp}] ${info.level.toUpperCase()}: ${info.message}`)
  ),
  transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: process.env.LOGFILE || 'logger.log' }),
  ]
});

bskyAgent.login({
  // set in .env
  identifier: process.env.BLUESKY_HANDLE,
  password: process.env.BLUESKY_PASSWORD,
}).catch(err => {
  console.error('Error logging into Bluesky:', err);
});

// slash command
const commands = [
  {
    name: 'post', // command name
    description: 'Post a message to Bluesky',
  },
];

(async () => {
  // await clearCommands()
  try {
    console.log('Registering slash commands...'); // global
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Slash commands registered!');
  } catch (err) {
    console.error('Error registering slash commands:', err);
  }
})();

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isCommand() && !interaction.isModalSubmit()) return;
  if (!process.env.IDs.includes(interaction.user.id)) { logger.warn(`Unauthorized user ${interaction.user.username} attempted to use a command.`); return; } // limit to defined users

  if (interaction.isCommand() && interaction.commandName === 'post') {
      logger.debug(`${interaction.username} ran the \`post\` command`)      

        const modal = new ModalBuilder()
            .setCustomId('messageModal')
            .setTitle('Message to post to Bluesky');

        // message
        const messageInput = new TextInputBuilder()
            .setCustomId('messageInput')
            .setLabel('Enter the Message:')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        // add input to actionrows
        const messageRow = new ActionRowBuilder().addComponents(messageInput);

        // add rows to the modal
        modal.addComponents(messageRow);

        await interaction.showModal(modal);
  }

  // modal submission
  if (interaction.isModalSubmit() && interaction.customId === 'messageModal') {
    const message = interaction.fields.getTextInputValue('messageInput');

    // send to bluesky
    try {
      await bskyAgent.post({ text: message });
      console.log(`${interaction.user.username} posted to Bluesky: ${message}`) // username posted
      interaction.reply(`Posted to Bluesky: "${message}"`);
    } catch (err) {
      console.error('Error posting to Bluesky:', err);
      await interaction.reply('Failed to post to Bluesky.');
    }

    logger.info(`${interaction.username} posted: "${message}".`)
}
});

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
    logger.info("Caught interrupt signal, shutting down!");
    process.exit();
});
