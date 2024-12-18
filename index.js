require('dotenv').config();
const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');
const { BskyAgent } = require('@atproto/api');

const commands = require('./commands.json');
console.log(commands)

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

let streaming = true;

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
  await clearCommands()
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

client.on('messageCreate', () => {
  //if (message.author.bot || message.channel.id != process.env.STREAMCHANNEL || streaming === false) return;

  console.log('it worked');
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return; // only commands

  if (interaction.commandName === 'post') { // only the command
    const message = interaction.options.getString('message');
    try {
      await bskyAgent.post({ text: message });
      await interaction.reply(`Posted to Bluesky: "${message}"`);
      console.log(`${interaction.user.username} posted to Bluesky: ${message}`) // username posted
    } catch (err) {
      console.error('Error posting to Bluesky:', err);
      await interaction.reply('Failed to post to Bluesky.');
    }
  }

  if (interaction.commandName === 'stream') {
    if (interaction.options.getString('true'))
      await interaction.reply('ok')
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
