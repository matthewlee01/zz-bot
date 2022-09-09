const traverseInterestData = (interestData) => {
  const traverseInterests = (interests) => {
    if (!interests) {
      return [];
    } else if (interests.length == 1) {
      return [interests[0].game];
    } else {
      return traverseInterest(interests[0]).concat(
        traverseInterests(interests.slice(1))
      );
    }
  };
  const traverseInterest = (interest) => {
    if (interest.children) {
      return [interest.game].concat(traverseInterests(interest.children));
    } else {
      return [interest.game];
    }
  };
  return traverseInterests(interestData);
};

const searchInterestData = (interestData, game) => {
  const searchInterests = (interests) => {
    if (!interests) {
      return false;
    } else if (interests.length == 1) {
      return searchInterest(interests[0]);
    } else {
      return (
        searchInterest(interests[0]) || searchInterests(interests.slice(1))
      );
    }
  };
  const searchInterest = (interest) => {
    if (interest.game == game) {
      return interest;
    } else {
      return searchInterests(interest.children);
    }
  };
  return searchInterests(interestData);
};

module.exports = {
  traverseInterestData: traverseInterestData,
  searchInterestData: searchInterestData,
};
