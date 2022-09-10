const { prisma } = require("../lib/prisma.js");
const { SlashCommandBuilder } = require("discord.js");
const gameData = require("../game-data.json");
const { traverseGameData } = require("../lib/game-data-helpers.js");
const { embedTemplate } = require("../lib/embed-helper.js");

let gameList = traverseGameData(gameData.data).map((name) => ({
  name: name,
  value: name,
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("interest")
    .setDescription("set which games you're interested in being notified about")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("add an interest")
        .addStringOption((option) =>
          option
            .setName("interest")
            .setDescription("the interest to be added")
            .setRequired(true)
            .addChoices(...gameList)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setDescription("remove an interest")
        .addStringOption((option) =>
          option
            .setName("interest")
            .setDescription("the interest to be removed")
            .setRequired(true)
            .addChoices(...gameList)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("view your current interests")
    ),

  traverseGameData: traverseGameData,
  async execute(interaction) {
    const tag = interaction.user.tag;
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const data = await prisma.member.findUnique({
      where: {
        userId_guildId: {
          userId: userId,
          guildId: guildId,
        },
      },
      select: {
        interests: true,
      },
    });
    let interests = data ? data.interests : [];

    const upsertInterests = async (interests) => {
      await prisma.member.upsert({
        where: {
          userId_guildId: {
            userId: userId,
            guildId: guildId,
          },
        },
        create: {
          tag: tag,
          userId: userId,
          guildId: guildId,
          interests: interests,
        },
        update: {
          interests: interests,
        },
      });
    };

    let embed = embedTemplate;
    if (interaction.options.getSubcommand() == "add") {
      const interestToAdd = interaction.options.getString("interest");
      if (interests.indexOf(interestToAdd) == -1) {
        interests.push(interestToAdd);
      }
      await upsertInterests(interests);
      embed.title = `interest ${interestToAdd} added successfully`
      console.log(`| [interest.js] ${tag} added interest ${interestToAdd}`);
    }

    if (interaction.options.getSubcommand() == "remove") {
      const interestToRemove = interaction.options.getString("interest");
      interests = interests.filter((interest) => interest != interestToRemove);
      await upsertInterests(interests);
      embed.title = `interest ${interestToRemove} removed successfully`
      console.log(
        `| [interest.js] ${tag} removed interest ${interestToRemove}`
      );
    }

    let descriptionString = "your current interests are:";
    if (interests.length == 0) {
      descriptionString = "you currently have no interests.";
    } else {
      interests.forEach((interest) => {
        descriptionString = descriptionString.concat(`\n${interest}`);
      });
    }
    embed.description = descriptionString;
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
