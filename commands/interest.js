const { prisma } = require("../lib/prisma.js");
const { SlashCommandBuilder } = require("discord.js");
const interestData = require("../interests.json");
const { traverseInterestData } = require("../lib/interest-helpers.js");

let interestList = traverseInterestData(interestData.data).map((interest) => ({
  name: interest,
  value: interest,
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
            .addChoices(...interestList)
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
            .addChoices(...interestList)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("list").setDescription("view your current interests")
    ),

  traverseInterestData: traverseInterestData,
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

    if (interaction.options.getSubcommand() == "add") {
      const interestToAdd = interaction.options.getString("interest");
      if (interests.indexOf(interestToAdd) == -1) {
        interests.push(interestToAdd);
      }
      await upsertInterests(interests);
      console.log(`| [interest.js] ${tag} added interest ${interestToAdd}`);
    }

    if (interaction.options.getSubcommand() == "remove") {
      const interestToRemove = interaction.options.getString("interest");
      interests = interests.filter((interest) => interest != interestToRemove);
      await upsertInterests(interests);
      console.log(
        `| [interest.js] ${tag} removed interest ${interestToRemove}`
      );
    }

    let replyString = "your current interests are:";
    if (interests.length == 0) {
      replyString = "you currently have no interests.";
    } else {
      interests.forEach((interest) => {
        replyString = replyString.concat(`\n${interest}`);
      });
    }
    await interaction.reply({ content: replyString, ephemeral: true });
  },
};
