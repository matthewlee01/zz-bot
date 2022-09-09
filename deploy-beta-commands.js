require('dotenv').config()
const clientId = process.env.CLIENT_ID;
const token = process.env.TOKEN;

const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

const commands = [];
const commandsPath = path.join(__dirname, 'beta-commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);

rest.put(Routes.applicationGuildCommands(clientId, process.env.BETA_GUILD), { body: commands })
	.then((data) => console.log(`| [deploy-commands.js] successfully registered ${data.length} application beta commands`))
	.catch(console.error);