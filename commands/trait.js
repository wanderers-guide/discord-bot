const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu } = require('discord.js');

const fetch = require('node-fetch');
const { apiUrl, apiKey } = require('../config.json');

const Utils = require('../utils.js');
const TextProcessing = require('../text-processing.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('trait')
    .setDescription('Privately displays a description for a trait.').addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the trait.')
        .setRequired(true)),

  async execute(interaction, name, ephemeral=true) {
    await interaction.deferReply({ ephemeral });

    await fetch(apiUrl+'trait?name='+encodeURIComponent(name), {
      method: 'GET',
      headers: {
          'Authorization': 'Apikey '+apiKey,
          'Content-Type': 'application/json',
      },
    })
    .then(response => response.json())
    .then(data => {

      let name = `${data.trait.name}`;

      let result = TextProcessing.process(data.trait.description);

      let selectOptions = [];
      for(const feat of result.feats){
        selectOptions.push({
          label: Utils.capitalizeWords(feat),
          description: 'Action / Feat',
          value: `feat:::${feat}`,
        });
      }
      for(const item of result.items){
        selectOptions.push({
          label: Utils.capitalizeWords(item),
          description: 'Item',
          value: `item:::${item}`,
        });
      }
      for(const spell of result.spells){
        selectOptions.push({
          label: Utils.capitalizeWords(spell),
          description: 'Spell',
          value: `spell:::${spell}`,
        });
      }
      for(const trait of result.traits){
        selectOptions.push({
          label: Utils.capitalizeWords(trait),
          description: 'Trait',
          value: `trait:::${trait}`,
        });
      }

      // Remove duplicate entries
      selectOptions = selectOptions.filter((value, index, self) =>
        index === self.findIndex((t) => (
          t.label === value.label
        ))
      );

      const row = new MessageActionRow().addComponents(new MessageSelectMenu()
          .setCustomId('referenced-content')
          .setPlaceholder('Referenced Content')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(selectOptions));
      
      let description = result.text;
      // Limit to only first 4000 characters (nearing message limit size)
      if(description.length > 4000){
        description = description.substring(0,4000);
        description += '...\n\n_Reached max message length. To get full description, visit the link._';
      }

      const embed = new MessageEmbed()
          .setColor('#209CEE')
          .setTitle(name)
          .setDescription(description);
      
      let components = null;
      if(selectOptions.length > 0){
        components = [row];
      }
      interaction.editReply({ embeds: [embed], components: components, ephemeral: ephemeral });
      
    }).catch((error) => {

      console.error(error);
      
      interaction.editReply({ content: `:warning: Failed to fetch trait with name "${name}" :warning:`, ephemeral: ephemeral });

    });
    
  },
};