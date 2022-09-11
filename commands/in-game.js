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
    return { status: { message: error } };
  }
};

const fetchGame = async (id) => {
  try {
    const res = await fetch(
      `${API_URL}/spectator/v4/active-games/by-summoner/${encodeURIComponent(ign)}`,
      { headers: defaultHeaders }
    );
    const data = await res.json();
      return data;
  } catch (error) {
    return { status: { message: error } };
  }
};

module.exports = {
  data: new SlashCommandBuilder()
  .setName("in-game")
  .setDescription("checks if dude is in game")
  .addUserOption(option => 
    option.setName('user')
    .setDescription('dude')
    .setRequired(true)),
async execute(interaction) {
    const user = interaction.options.getUser("user");
    const member = await prisma.member.findFirst({
      where: {
        userId: user.id,
      }
    });
    const summonerID = await fetchSummoner(member.ign).id;
    const game = await fetchGame(summonerID);
    const msg = game.status ? `${member.ign} is not in game lol!` : `${member.ign} is in game lol!`;
    await interaction.reply({embeds: [{
      ...embedTemplate,
      title: msg
    }]});
  }
}