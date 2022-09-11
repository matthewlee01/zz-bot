const { prisma } = require("../lib/prisma.js");
const { SlashCommandBuilder } = require("discord.js");
const { embedTemplate } = require("../lib/embed-helper.js");
const API_URL = "https://na1.api.riotgames.com/lol";
const defaultHeaders = {
  "Accept-Language": "en-CA,en;q=0.9,en-US;q=0.6,en-GB;q=0.4",
  "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
  Origin: "https://developer.riotgames.com",
  "X-Riot-Token": process.env.RIOT_API_KEY,
};

const fetchSummoner = async (ign) => {
  try {
    const res = await fetch(
      `${API_URL}/summoner/v4/summoners/by-name/${encodeURIComponent(ign)}`,
      { headers: defaultHeaders }
    );
    const data = await res.json();
      return data;
  } catch (error) {
    console.log(error);
    return { status: { message: error } };
  }
};

const fetchGame = async (id) => {
  try {
    const res = await fetch(
      `${API_URL}/spectator/v4/active-games/by-summoner/${encodeURIComponent(id)}`,
      { headers: defaultHeaders }
    );
    const data = await res.json();
      console.log(data);
      return data;
  } catch (error) {
    return { status: { message: error } };
  }
};

module.exports = {
  data: new SlashCommandBuilder()
  .setName("in-game")
  .setDescription("checks if dude is in game")
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
    const game = await fetchGame(summonerId);
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
        }
      //   guildId: guildId
      },
      select: {
        ign: true,
      }
    });
    inGameIgns = 
    (await Promise.all(
      members
      .map(async (member) => ({ ign : member.ign , game : await fetchGame((await fetchSummoner(member.ign)).id) }))))
    .reduce((igns, {ign, game}) => (game.status ? igns : igns.concat([ign])), []);

    const msg = (inGameIgns.length == 0) ? "Nobody is in game..." : inGameIgns.join(", ").concat(inGameIgns.length == 1 ? " is in game" : " are in game");
    await interaction.reply({embeds: [{
      ...embedTemplate,
      title: msg
    }]});
  }

  }
}