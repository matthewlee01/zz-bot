const { prisma } = require("../lib/prisma.js");
const { SlashCommandBuilder } = require("discord.js");
const { embedTemplate } = require("../lib/embed-helper");
const gameData = require("../assets/game-data.json");
const {
  traverseGameData,
  searchGameData,
} = require("../lib/game-data-helpers.js");
let gameList = traverseGameData(gameData).map((name) => ({
  name: name,
  value: name,
}));
gameList.push({
  name: "custom (must specify party size)",
  value: "custom",
});

const parseReactors = (reactionCollection) => {
  let userIds = new Set();
  reactionCollection.forEach((reaction) => {
    reaction.users.cache.forEach((user) => {
      userIds.add(user.id);
    });
  });
  return Array.from(userIds);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("party")
    .setDescription("create a party")
    .addStringOption((option) =>
      option
        .setName("game-type")
        .setDescription("category for this party")
        .setRequired(true)
        .setChoices(...gameList)
    )
    .addIntegerOption((option) =>
      option
        .setName("party-size")
        .setDescription("optional override for party size")
    )
    .addIntegerOption((option) => 
      option
        .setName("timeout")
        .setDescription("time (in minutes) before the party attempt expires - defaults to 60")
    ),
  async execute(interaction) {
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const gameType = interaction.options.getString("game-type");
    const [ game ] = searchGameData(gameData, { name: gameType });
    const partySize =
      interaction.options.getInteger("party-size") || game?.["party-size"];
    const timeout = interaction.options.getInteger("timeout") * 60000 || 3600000;

    // handle bad args
    if (partySize <= 1) {
      await interaction.reply({
        embeds: [
          {
            ...embedTemplate,
            title: "error: party size must be larger than 1",
            description:
              "try using the default party size, or specifiying a number larger than 1.",
          },
        ],
        ephemeral: true,
      });
    } else if (gameType == "custom" && !partySize) {
      await interaction.reply({
        embeds: [
          {
            ...embedTemplate,
            title: "error: must specify game-type or custom party size",
            description:
              "custom parties do not have a default size, so a party-size must be specified.",
          },
        ],
        ephemeral: true,
      });
    } else {
      const interestedMembers = await prisma.member.findMany({
        where: {
          interests: {
            hasSome: [
              gameType,
              ...traverseGameData(game?.children),
              game?.parent || "",
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

      // generate response
      const interestedMemberString = interestedMembers.reduce(
        (str, member) => str.concat(`<@${member.userId}> `),
        ""
      );
      let embed = {
        ...embedTemplate,
        title: `${interaction.member.displayName} is creating a party`,
        description:
          "react to this message to join the party and be notified once everyone is ready.",
        fields: [
          {
            name: "game type",
            value: gameType,
            inline: true,
          },
          {
            name: "party size",
            value: partySize,
            inline: true,
          },
          {
            name: "interested members",
            value:
              interestedMemberString === ""
                ? "none :("
                : interestedMemberString,
            inline: false,
          },
        ],
      };
      let message = await interaction.reply({
        content: interestedMemberString,
        embeds: [embed],
        fetchReply: true,
      });
      console.log(
        `| [party.js] ${interaction.user.tag} has created a ${gameType} party of size ${partySize}`
      );

      // await reactions
      const filter = (_, user) => {
        return (
          message.reactions.cache.filter((reaction) => {
            return reaction.users.cache.find(
              (previousUser) => user.id == previousUser.id
            );
          }).size <= 1 && user.id != userId
        );
      };
      message
        .awaitReactions({
          filter,
          max: partySize,
          time: timeout,
          errors: ["time"],
        })
        .then((_) => {
          // notify party
          let followUpString = `<@${userId}> `;
          parseReactors(message.reactions.cache).forEach((reactorId) => {
            if (
              reactorId != interaction.client.user.id &&
              reactorId != userId
            ) {
              followUpString = followUpString.concat(`<@${reactorId}> `);
            }
          });
          interaction.followUp({
            content: followUpString,
            embeds: [
              {
                ...embedTemplate,
                title: `${interaction.member.displayName}'s party is complete`,
                description: "everyone is here!",
                fields: [
                  {
                    name: "party members",
                    value: followUpString,
                    inline: false,
                  },
                ],
              },
            ],
          });
          console.log(
            `| [party.js] ${interaction.user.tag}'s party successfully created`
          );
        })
        .catch((_) => {
          interaction.followUp({
            content: `<@${userId}>`,
            embeds: [
              {
                ...embedTemplate,
                title: "party creation timed out",
                description: "we'll get em next time...",
                thumbnail: {
                  url: "https://i.kym-cdn.com/photos/images/facebook/001/857/750/4ab.png",
                },
              },
            ],
          });
          console.log(`| [party.js] ${interaction.user.tag}'s party timed out`);
        });
      await message.react("👍");
    }
  },
};
