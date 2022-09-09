require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const token = process.env.TOKEN;

const fs = require('node:fs');
const path = require('node:path');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessages,
	],
});
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
	.readdirSync(commandsPath)
	.filter((file) => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

const betaCommandsPath = path.join(__dirname, 'beta-commands');
const betaCommandFiles = fs
	.readdirSync(betaCommandsPath)
	.filter((file) => file.endsWith('.js'));
for (const file of betaCommandFiles) {
	const filePath = path.join(betaCommandsPath, file);
	const command = require(filePath);
	client.commands.set(command.data.name, command);
}

client.once('ready', () => {
	console.log('| [server.js] zz\'bot portal open!');
});

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({
			content: `error while executing this command: ${error}`,
			ephemeral: true,
		});
	}
});

client.login(token);
