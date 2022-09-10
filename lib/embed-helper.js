require('dotenv').config();

module.exports = {
  embedTemplate: {
    color: Number(process.env.THEME_COLOR),
    author: { name: "zz'bot", iconURL: process.env.ICON_URL },
  }
}