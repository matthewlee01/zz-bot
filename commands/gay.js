const { SlashCommandBuilder } = require("discord.js");
const { GAYS } = require("../lib/pastas.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("gay")
    .setDescription("say a line from gay porn"),
  async execute(interaction) {
    const i = Math.floor(Math.random() * GAYS.length);
    await interaction.reply(GAYS[i]);
  },
};
  