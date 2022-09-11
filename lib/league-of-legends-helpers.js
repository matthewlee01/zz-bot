require("dotenv").config();

const API_URL = "https://na1.api.riotgames.com/lol";
const SS_EMOJIS = {
  flash: ":sparkles:",
  ignite: ":fire:",
  exhaust: ":face_exhaling:",
  smite: ":zap:",
  cleanse: ":cyclone:",
  mark: ":white_circle:",
  barrier: ":yellow_circle:",
  ghost: ":dash:",
  heal: ":green_heart:",
  clarity: ":droplet:",
  teleport: ":gemini:",
};
const DEFAULT_HEADERS = {
  "Accept-Language": "en-CA,en;q=0.9,en-US;q=0.6,en-GB;q=0.4",
  "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
  Origin: "https://developer.riotgames.com",
  "X-Riot-Token": process.env.RIOT_API_KEY,
};
const QUEUE_DATA = require("../assets/queue-data.json");
const SS_DATA = require("../assets/summoner-spell-data.json");
const CHAMPION_DATA = require("../assets/champion-data.json");

const fetchSummoner = async (ign) => {
  try {
    const res = await fetch(
      `${API_URL}/summoner/v4/summoners/by-name/${encodeURIComponent(ign)}`,
      { headers: DEFAULT_HEADERS }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    return { status: { message: error } };
  }
};

const fetchLiveMatch = async (summonerId) => {
  try {
    const res = await fetch(
      `${API_URL}/spectator/v4/active-games/by-summoner/${summonerId}`,
      { headers: DEFAULT_HEADERS }
    );
    const data = await res.json();
    return data;
  } catch (error) {
    return { status: { message: error } };
  }
};

const fetchRank = async (summonerId) => {
  try {
    const res = await fetch(
      `${API_URL}/league/v4/entries/by-summoner/${summonerId}`,
      {
        headers: DEFAULT_HEADERS,
      }
    );
    const data = await res.json();
    console.log(data);
    return data;
  } catch (error) {
    return { status: { message: error } };
  }
};

const parseRank = (rankData, queueType) => {
  if (rankData.length == 0) {
    return "◼️ unranked";
  }
  const rankedQueues = {
    420: "RANKED_SOLO_5x5",
    440: "RANKED_FLEX_SR",
  };
  const tierEmojis = {
    IRON: ":black_circle:",
    BRONZE: ":brown_circle:",
    SILVER: ":white_circle:",
    GOLD: ":yellow_circle:",
    PLATINUM: ":purple_circle:",
    DIAMOND: ":blue_circle:",
    MASTER: ":purple_heart:",
    GRANDMASTER: ":diamonds:",
    CHALLENGER: ":diamond_shape_with_a_dot_inside:",
  };
  const relevantRank =
    rankData.find((rank) => rank.queueType == rankedQueues[`${queueType}`]) ||
    rankData.sort(compareRank)[0];
  return `${tierEmojis[relevantRank.tier]} ${relevantRank.tier.toLowerCase()} ${
    relevantRank.rank
  } (${relevantRank.leaguePoints} LP)`;
};

const compareRank = (rank1, rank2) => {
  const tierOrder = [
    "IRON",
    "BRONZE",
    "SILVER",
    "GOLD",
    "PLATINUM",
    "DIAMOND",
    "MASTER",
    "GRANDMASTER",
    "CHALLENGER",
  ];
  const rankOrder = ["IV", "III", "II", "I"];
  if (rank1.tier != rank2.tier) {
    return tierOrder.indexOf(rank1.tier) - tierOrder.indexOf(rank2.tier);
  } else if (rank1.rank != rank2.rank) {
    return rankOrder.indexOf(rank1.rank) - tierOrder.indexOf(rank2.rank);
  } else {
    return rank1.leaguePoints - rank2.leaguePoints;
  }
};

const championIdToString = (championId) => {
  return Object.entries(CHAMPION_DATA).find(
    (entry) => Number(entry[1].key) == championId
  )[1].name;
};

const queueIdToString = (queueId) => {
  const queueType = QUEUE_DATA.find(
    (queueType) => queueType.queueId == queueId
  );
  let queueDescription = queueType.description
    .slice(0, queueType.description.indexOf(" games"))
    .toLowerCase();
  return queueDescription;
};

const gameLengthInSecondsToString = (gameLengthInSeconds) => {
  const minutes = Math.floor(gameLengthInSeconds / 60);
  const seconds = gameLengthInSeconds % 60;
  const timeString =
    seconds < 10 ? `${minutes}:0${seconds}` : `${minutes}:${seconds}`;
  return timeString;
};

const summonerSpellIdToString = (ssId) => {
  const spell = Object.entries(SS_DATA).find(
    (entry) => Number(entry[1].key) == ssId
  )[1];
  return SS_EMOJIS[spell.name.toLowerCase()];
};

module.exports = {
  fetchSummoner: fetchSummoner,
  fetchLiveMatch: fetchLiveMatch,
  championIdToString: championIdToString,
  queueIdToString: queueIdToString,
  gameLengthInSecondsToString: gameLengthInSecondsToString,
  summonerSpellIdToString: summonerSpellIdToString,
  fetchRank: fetchRank,
  parseRank: parseRank,
};
