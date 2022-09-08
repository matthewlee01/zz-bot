const { prisma } = require("../lib/prisma.js");
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("register your in game name")
    .addStringOption(option => 
      option.setName('ign')
      .setDescription('your riot username')
      .setRequired(true)),
  async execute(interaction) {
    const tag = interaction.user.tag;
    const userId = interaction.user.id;
    const guildId = interaction.guild.id;
    const ign = interaction.options.getString('ign');
    const member = await prisma.member.upsert({
      where: {
        userId_guildId: {
          userId: userId,
          guildId: guildId,
        },
      },
      create: {
        userId: userId,
        tag: tag,
        guildId: guildId,
        ign: ign,
      },
      update: {
        ign: ign,
      },
    });
    console.log(`| [register.js] member ${member.tag} registered in guild ${member.guildId} with IGN: '${member.ign}'`);
    await interaction.reply(`${member.tag} registered with IGN '${member.ign}'!`);
  },
};
