const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle
} = require('discord.js');

const { logger } = require('../../functions.js');
const { bskyAgent } = require('../../functions.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('post')
		.setDescription('Post to Bluesky'),
    
	async execute(interaction) {
        // interaction.deferReply();
		logger.debug(`${interaction.user.username} ran the \'post\' command`)      

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

        // modal submission
        if (interaction.isModalSubmit() && interaction.customId === 'messageModal') {
            const message = interaction.fields.getTextInputValue('messageInput');

            // send to bluesky
            try {
                await bskyAgent.post({ text: message });
                logger.info(`${interaction.user.username} posted to Bluesky: ${message}`) // username posted
                interaction.reply(`Posted to Bluesky: "${message}"`);
            } catch (err) {
                logger.error('Error posting to Bluesky:', err);
                await interaction.reply('Failed to post to Bluesky.');
            };

            logger.info(`${interaction.username} posted: "${message}".`);
        };
	},
};
