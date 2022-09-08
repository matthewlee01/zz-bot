const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('party')
		.setDescription('create a party'),
	async execute(interaction) {
    member = 
		await interaction.reply('Pong!');
	},
};
