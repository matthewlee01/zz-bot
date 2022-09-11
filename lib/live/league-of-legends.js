const { embedTemplate } = require("../embed-helper.js");
const lol = require("../league-of-legends-helpers.js");
const SECONDS_OFFSET = 150;
const BLUE_TEAM_ID = 100;

const parseParticipant = async (participant, queueType) => {
  return {
    name: participant.summonerName,
    summonerSpells: [
      lol.summonerSpellIdToString(participant.spell1Id),
      lol.summonerSpellIdToString(participant.spell2Id),
    ],
    champion: lol.championIdToString(participant.championId),
    rank: lol.parseRank(await lol.fetchRank(participant.summonerId), queueType),
  };
};

const parseParticipants = async (participants, queueType) => {
  return (
    await Promise.all(
      participants.map((participant) =>
        parseParticipant(participant, queueType)
      )
    )
  ).reduce(
    (prev, curr) => ({
      names: `${prev.names + curr.name}\n`,
      championInfo: `${prev.championInfo + curr.summonerSpells[0]} ${
        curr.summonerSpells[1]
      } ${curr.champion}\n`,
      ranks: `${prev.ranks + curr.rank}\n`,
    }),
    {
      names: "",
      championInfo: "",
      ranks: "",
    }
  );
};

const generateEmbed = async (ign) => {
  const summonerData = await lol.fetchSummoner(ign);
  if (summonerData.status) {
    console.log(`| [league-of-legends.js] error: ${summonerData}`)
    return {
      ...embedTemplate,
      title: `error fetching summoner '${ign}`,
      description: summonerData.status.message,
    };
  }
  const matchData = await lol.fetchLiveMatch(summonerData.id);
  if (matchData.status) {
    console.log(`| [league-of-legends.js] error: ${matchData}`)
    return {
      ...embedTemplate,
      title: `error fetching live match data for '${ign}'`,
      description: matchData.status.message,
    };
  }

  const blueTeam = matchData.participants.filter(
    (participant) => participant.teamId == BLUE_TEAM_ID
  );
  const blueTeamData = await parseParticipants(
    blueTeam,
    matchData.gameQueueConfigId
  );
  const redTeam = matchData.participants.filter(
    (participant) => participant.teamId != BLUE_TEAM_ID
  );
  const redTeamData = await parseParticipants(
    redTeam,
    matchData.gameQueueConfigId
  );
  let embed = {
    ...embedTemplate,
    title: `live match data for '${ign}' (${lol.queueIdToString(
      matchData.gameQueueConfigId
    )})`,
    description: `estimated game time: ${lol.gameLengthInSecondsToString(
      matchData.gameLength + SECONDS_OFFSET
    )}`,
    fields: [
      {
        name: ":blue_square: blue team",
        value: blueTeamData.names,
        inline: true,
      },
      {
        name: "rank",
        value: blueTeamData.ranks,
        inline: true,
      },
      {
        name: "champion info",
        value: blueTeamData.championInfo,
        inline: true,
      },
      {
        name: ":red_square: red team",
        value: redTeamData.names,
        inline: true,
      },
      {
        name: "rank",
        value: redTeamData.ranks,
        inline: true,
      },
      {
        name: "champion info",
        value: redTeamData.championInfo,
        inline: true,
      },
    ],
  };
  return embed;
};

module.exports = {
  generateEmbed: generateEmbed,
};
