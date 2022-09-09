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

const parseReactors = (reactionCollection) => {
  let userIds = new Set();
  reactionCollection.forEach(reaction => {
    reaction.users.cache.forEach(user => {
      userIds.add(user.id);
    })
  })
  return Array.from(userIds);
}

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
      let replyString = `<@${userId}> has started a party!\n| party size: ${partySize}`;
      if (gameType)
        replyString = replyString.concat(`\n| party type: ${gameType}`);
      interestedMembers.forEach((member) => {
        replyString = replyString.concat(`\n| <@${member.userId}>`);
      });
      let message = await interaction.reply({
        content: replyString,
        fetchReply: true,
      });
      console.log(
        `| [party.js] ${interaction.user.tag} has created a ${gameType} party of size ${partySize}`
      );

      await message.react("👍");
      const filter = (_, user) => {
        return (
          message.reactions.cache.filter((reaction) => {
            return reaction.users.cache.find((previousUser) => user.id == previousUser.id)}
          ).size <=1 && user.id != userId
        );
      };

      message
        .awaitReactions({ filter, max: partySize, time: 20000, errors: ["time"] })
        .then((_) => {
          let followUpString = `<@${userId}>, your party is ready!`
          parseReactors(message.reactions.cache).forEach((reactorId) => {
            if (reactorId != interaction.client.user.id) {
              followUpString = followUpString.concat(`\n| <@${reactorId}>`)
            }
          })
          interaction.followUp(followUpString);
          console.log(`| [party.js] ${interaction.user.tag}'s party successfully created`)
        })
        .catch((_) => {
          interaction.followUp(`<@${userId}>\'s party timed out.`);
          console.log(
            `| [party.js] ${interaction.user.tag}'s party timed out`
          );
        });
    }
  },
};
