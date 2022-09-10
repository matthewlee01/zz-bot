const traverseGameData = (gameData) => {
  const traverseGames = (games) => {
    if (!games) {
      return [];
    } else if (games.length == 1) {
      return [games[0].name];
    } else {
      return traverseGame(games[0]).concat(traverseGames(games.slice(1)));
    }
  };
  const traverseGame = (game) => {
    if (game.children) {
      return [game.name].concat(traverseGames(game.children));
    } else {
      return [game.name];
    }
  };
  return traverseGames(gameData);
};

const searchGameData = (gameData, args) => {
  const gameContainsArgs = (game) => {
    return Object.entries(args)
      .map((entry) => game[entry[0]] == [entry[1]])
      .reduce((x, y) => x && y, true);
  };
  const searchGames = (games) => {
    if (!games) {
      return false;
    } else if (games.length == 1) {
      return searchGame(games[0]);
    } else {
      return searchGame(games[0]) || searchGames(games.slice(1));
    }
  };
  const searchGame = (game) => {
    if (gameContainsArgs(game)) {
      return game;
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
