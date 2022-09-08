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
    const guildId = Number(interaction.guild.id.toString());
    const ign = interaction.options.getString('ign');
    const member = await prisma.member.upsert({
      where: {
        tag_guildId: {
          tag: tag,
          guildId: guildId,
        },
      },
      create: {
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
