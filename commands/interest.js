const { prisma } = require("../lib/prisma.js");
const { SlashCommandBuilder } = require("discord.js");
const interests = require("../interests.json");
const interestList = Object.keys(interests).map((key) => ({
  name: key,
  value: key,
}));

module.exports = {
  data: new SlashCommandBuilder()
    .setName("interest")
    .setDescription("set which games you're interested in playing")
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
  async execute(interaction) {
    const tag = interaction.user.tag;
    const guildId = Number(interaction.guild.id.toString());
    let { interests } = await prisma.member.findUnique({
      where: {
        tag_guildId: {
          tag: tag,
          guildId: guildId,
        },
      },
      select: {
        interests: true,
      },
    });

    const upsertInterests = async (interests) => {
      await prisma.member.upsert({
        where: {
          tag_guildId: {
            tag: tag,
            guildId: guildId,
          },
        },
        create: {
          tag: tag,
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
      console.log(`| [interest.js] ${tag} removed interest ${interestToRemove}`);
    }

    let replyString = "your current interests are:";
    if (interests.length == 0) {
      replyString = "you currently have no interests.";
    } else {
      interests.forEach((interest) => {
        console.log(interest);
        replyString = replyString.concat(`\n${interest}`);
      });
    }
    await interaction.reply(replyString);
  },
};
