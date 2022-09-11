const { prisma } = require("../lib/prisma.js");
const { SlashCommandBuilder } = require("discord.js");
const gameData = require("../assets/game-data.json");
const { searchGameData } = require("../lib/game-data-helpers.js");
const { embedTemplate } = require("../lib/embed-helper.js");

const liveGameList = searchGameData(gameData, { "live-data": true }).map(
  (game) => ({ name: game.name, value: game.name })
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName("match")
    .setDescription("view info about a match")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("live")
        .setDescription("live info for an ongoing match")
        .addStringOption((option) =>
          option
            .setName("game-type")
            .setDescription(
              "the game to view - live info is currently not available for most games"
            )
            .setRequired(true)
            .addChoices(...liveGameList)
        )
        .addStringOption((option) =>
          option
            .setName("ign")
            .setDescription(
              "the user to retrieve info for - defaults to your registered IGN if you have one"
            )
        )
    ),

  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const gameType = interaction.options.getString("game-type");
    const ign =
      interaction.options.getString("ign") ||
      (
        await prisma.member.findUnique({
          where: {
            userId_guildId: {
              userId: userId,
              guildId: guildId,
            },
          },
          select: {
            ign: true,
          },
        })
      )?.ign;

    if (!ign) {
      await interaction.reply({
        embeds: [
          {
            ...embedTemplate,
            title: "error: must register or specify an IGN",
            description:
              "you must either specify a username, or register a default one using `/register`",
          },
        ],
        ephemeral: true,
      });
    } else {
      const {
        generateEmbed,
      } = require(`../lib/${interaction.options.getSubcommand()}/${gameType}.js`);
      const embed = await generateEmbed(ign);
      await interaction.reply({
        embeds: [embed],
      });
    }
  },
};
