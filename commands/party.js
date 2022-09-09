const { prisma } = require("../lib/prisma.js");
const { SlashCommandBuilder } = require("discord.js");
const interestData = require("../interests.json");
const {
  traverseInterestData,
  searchInterestData,
} = require("../lib/interest-helpers.js");
let interestList = traverseInterestData(interestData.data).map((interest) => ({
  name: interest,
  value: interest,
}));
interestList.push({
  name: "custom (must specify party size)",
  value: "custom",
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("party")
    .setDescription("create a party")
    .addStringOption((option) =>
      option
        .setName("game-type")
        .setDescription("category for this party")
        .setRequired(true)
        .setChoices(...interestList)
    )
    .addIntegerOption((option) =>
      option
        .setName("party-size")
        .setDescription("optional override for party size")
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const gameType = interaction.options.getString("game-type");
    const interest = searchInterestData(interestData.data, gameType);
    const partySize =
      interaction.options.getInteger("party-size") || interest?.["party-size"];
    if (partySize <= 1) {
      await interaction.reply({
        content: "error: party size must be larger than 1",
        ephemeral: true,
      });
    } else if (gameType == "custom" && !partySize) {
      await interaction.reply({
        content: "error: must specify game-type or custom party size",
        ephemeral: true,
      });
    } else {
      const interestedMembers = await prisma.member.findMany({
        where: {
          interests: {
            hasSome: [
              gameType,
              ...traverseInterestData(interest.children),
              interest.parent || "",
            ],
          },
          guildId: guildId,
          NOT: {
            userId: userId,
          },
        },
        select: {
          userId: true,
        },
      });
      let replyString = `<@${userId}> has started a party!\nparty size: ${partySize}`;
      if (gameType)
        replyString = replyString.concat(`\nparty type: ${gameType}`);
      interestedMembers.forEach((member) => {
        replyString = replyString.concat(`\n<@${member.userId}>`);
      });
      await interaction.reply(replyString);
      console.log(
        `| [party.js] ${interaction.user.tag} has created a ${gameType} party of size ${partySize}`
      );
    }
  },
};
