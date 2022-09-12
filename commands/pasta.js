const { SlashCommandBuilder } = require("discord.js");
const { PASTAS } = require("../lib/pastas.js");

const pastaNames = Object.keys(PASTAS).map(
  (name) => ({name: name, value: name})
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("pasta")
    .setDescription("copy the pasta")
    .addStringOption((option) =>
      option
        .setName("pasta")
        .setDescription("the pasta to be copied")
        .setRequired(true)
        .addChoices(...pastaNames)
    ),
  async execute(interaction) {
    const str = PASTAS[interaction.options.getString("pasta")];
    await interaction.reply(str);
  },
};


