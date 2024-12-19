require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { BskyAgent } = require('@atproto/api');
const commands = require('./commands.json');

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

bskyAgent.login({
  // set in .env
  identifier: process.env.BLUESKY_HANDLE,
  password: process.env.BLUESKY_PASSWORD,
}).catch(err => {
  console.error('Error logging into Bluesky:', err);
});

var streaming = false

async function clearCommands() {
  try {
      console.log('Clearing commands...');
      const globalCommands = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID));
      for (const command of globalCommands) {
          await rest.delete(Routes.applicationCommand(process.env.CLIENT_ID, command.id));
      }
      console.log('Commands cleared');
  } catch (error) {
      console.error('Error deleting commands:', error);
  }
}

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

client.on('messageCreate', async (message) => {
  try {if (message.author.bot || message.channel.id != process.env.STREAMCHANNEL || streaming == false) return} catch (ReferenceError) {return};

  try {
    await bskyAgent.post({ text: message.content });
    console.log(`${message.author.username} posted to Bluesky: ${message.content}`) // username posted
    message.reply(`Posted to Bluesky: "${message.content}"`);
  } catch (err) {
    console.error('Error posting to Bluesky:', err);
    message.reply('Failed to post to Bluesky.');
  }
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return; // only commands

  if (interaction.commandName === 'post') { // only the command
    const message = interaction.options.getString('message');
    try {
      await bskyAgent.post({ text: message });
      console.log(`${interaction.user.username} posted to Bluesky: ${message}`) // username posted
      interaction.reply(`Posted to Bluesky: "${message}"`);
    } catch (err) {
      console.error('Error posting to Bluesky:', err);
      interaction.reply('Failed to post to Bluesky.');
    }
  }

  if (interaction.commandName === 'stream') {
    streaming = interaction.options.getBoolean('stream');
    console.log(`Message streaming set to ${streaming} by ${interaction.user.username}`);
      if (streaming == false) { // after changing it
        await interaction.reply('Message streaming disabled.');
      }
      else {
        await interaction.reply('Message streaming enabled.');
      }
  }
});

client.login(process.env.DISCORD_TOKEN).then(() => {
  console.log('Discord bot is online!');
}).catch(err => {
  console.error('Error logging into Discord:', err);
});

process.on('SIGINT', function() {
    console.log("\nCaught interrupt signal, shutting down!");
    process.exit();
});
