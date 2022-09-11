const { prisma } = require("../lib/prisma.js");
const { SlashCommandBuilder } = require("discord.js");
const { embedTemplate } = require("../lib/embed-helper.js");
const { fetchSummoner, fetchLiveMatch } = require("../lib/league-of-legends-helpers.js");

module.exports = {
  data: new SlashCommandBuilder()
  .setName("in-game")
  .setDescription("checks if people are in game")
  .addSubcommand((subcommand) =>
    subcommand
      .setName("check")
      .setDescription("check if user is in game")
      .addUserOption(option => 
        option.setName('user')
        .setDescription('dude')
        .setRequired(true))
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("list")
      .setDescription("list all players in game")
  )
,
async execute(interaction) {
  if (interaction.options.getSubcommand() == "check") {
    const user = interaction.options.getUser("user");
    const member = await prisma.member.findFirst({
      where: {
        userId: user.id,
      }
    });
    const summonerId = await fetchSummoner(member.ign).id;
    const game = await fetchLiveMatch(summonerId);
    const msg = game.status ? `${member.ign} is not in game lol!` : `${member.ign} is in game lol!`;
    await interaction.reply({embeds: [{
      ...embedTemplate,
      title: msg
    }]});
  } else {
    const guildId = interaction.guild.id;
    const members = await prisma.member.findMany({
      where : {
        ign: {
          not: null,
        },
        guildId: guildId
      },
      select: {
        ign: true,
      }
    });
    inGameIgns = 
    (await Promise.all(
      members
      .map(async (member) => ({ ign : member.ign , game : await fetchLiveMatch((await fetchSummoner(member.ign)).id) }))))
    .reduce((igns, {ign, game}) => (game.status ? igns : igns.concat([ign])), []);

    const msg = (inGameIgns.length == 0) ? "Nobody is in game..." : inGameIgns.join(", ").concat(inGameIgns.length == 1 ? " is in game" : " are in game");
    await interaction.reply({embeds: [{
      ...embedTemplate,
      title: msg
    }]});
  }

  }
}