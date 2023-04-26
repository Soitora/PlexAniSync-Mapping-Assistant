import fs from "fs";
import yaml from "js-yaml";

function getSeasonStartEpisodes(seasons) {
  let seasonStarts = [];
  let currentSeasonStart = null;

  // Iterate through all the seasons
  seasons.forEach(season => {
    // If the current season has a start episode defined
    if (season.start) {
      // If we don't have a current start episode or the current start episode is different
      if (!currentSeasonStart || season.start !== currentSeasonStart.episode) {
        // Push the current start episode to the array
        seasonStarts.push({ season: season.season, episode: season.start });
        currentSeasonStart = { season: season.season, episode: season.start };
      }
    }
  });

  let result = '';
  let lastStart = null;
  // Iterate through all the season starts
  seasonStarts.forEach((start, index) => {
    // If this is not the first start episode
    if (index !== 0) {
      // If this start episode is right after the last start episode
      if (lastStart && start.episode === lastStart.episode + 1) {
        // Update the last start episode to include this one
        lastStart.episode = start.episode;
      } else {
        // Add the last start episode to the result string
        result += `Season: ${lastStart.season}\nStart: Episode ${lastStart.episode}`;
        // If this is not the last start episode, add a new line
        if (index !== seasonStarts.length - 1) {
          result += '-';
        }
      }
    }
    // If this is the last start episode or a new start episode
    if (index === seasonStarts.length - 1 || (index !== 0 && start.episode !== lastStart.episode + 1)) {
      // Add this start episode to the result string
      result += `Season: ${start.season}\nStart: Episode ${start.episode}`;
      // If this is not the last start episode, add a new line
      if (index !== seasonStarts.length - 1) {
        result += '-';
      }
    }
    lastStart = start;
  });

  // If the last season doesn't have a start episode defined
  if (seasonStarts.length > 0 && seasonStarts[seasonStarts.length - 1].episode !== seasons[seasons.length - 1].episodes) {
    // Add a plus to the last start episode
    result += '+';
  }

  return result;
}


try {
// Load the YAML file
const doc = yaml.loadAll(fs.readFileSync('yaml/series-tmdb.en.yaml', 'utf8'));

// Generate HTML content based on the YAML data
const content = `
<!DOCTYPE html>
<html>
<head>
    <title>PAS</title>
    <style>
          .flex-container {
            display: flex;
            flex-direction: column;
          }
          
          .flex-item {
            display: flex;
            flex-direction: column;
            margin-bottom: 10px;
          }
          
          .flex-sub-item {
            display: flex;
            flex-direction: row;
          }
          
          .flex-title {
            font-size: 24px;
            font-weight: bold;
            margin-right: 10px;
          }
    </style>
    <title></title>
</head>
<body>
    <h1>TMDB PAS Assistant</h1>
    <p>PlexAniSync Custom Mappings</p>
    <div class="flex-container">
    ${doc.entries.map(item => `
        ${console.log(doc)}
        <div class="flex-item">
            <h1 class="flex-title">${item.title}</h1>${item.seasons.map(season => `
            <div class="flex-sub-item">
              <div class="season-row"><span>Season: ${season.season}</span></div>
              <divclass="anilist-row"><span>Anilist ID: <a target="_blank" href="https://anilist.co/anime/${season['anilist-id']}">${season['anilist-id']}</a></span></div>
              ${season.start ? `<div class="start-row"><span>Start: Episode ${getSeasonStartEpisodes([season])}</span></div>` : ''}
            </div>`).join('')}
        </div>`).join('')}
    </div>
</body>
</html>
`;

// Output the content to the HTML file
fs.writeFileSync('output/tmdb-pas-assistant.html', content);
} catch (e) {
  console.log(`Error parsing YAML file: ${e.message}`);
}