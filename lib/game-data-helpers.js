const traverseGameData = (gameData) => {
  return searchGameData(gameData, {}).map(game => game.name);
};

// returns a list of games which have properties matching the args object
const searchGameData = (gameData, args) => {
  const gameContainsArgs = (game) => {
    return Object.entries(args)
      .map((entry) => game[entry[0]] == entry[1])
      .reduce((x, y) => x && y, true);
  };
  const searchGames = (games) => {
    if (!games) {
      return [];
    } else if (games.length == 1) {
      return searchGame(games[0]);
    } else {
      return searchGame(games[0]).concat(searchGames(games.slice(1)));
    }
  };
  const searchGame = (game) => {
    if (gameContainsArgs(game)) {
      return [game].concat(searchGames(game.children));
    } else {
      return searchGames(game.children);
    }
  };
  return searchGames(gameData);
};

module.exports = {
  traverseGameData: traverseGameData,
  searchGameData: searchGameData,
};
