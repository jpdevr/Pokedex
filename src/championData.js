export const CHAMPIONS = [
  {
    key: 'red',
    label: 'Red',
    team: ['pikachu', 'espeon', 'snorlax', 'venusaur', 'charizard', 'blastoise'],
  },
  {
    key: 'green',
    label: 'Green',
    team: ['pidgeot', 'alakazam', 'rhydon', 'exeggutor', 'gyarados', 'arcanine'],
  },
  {
    key: 'cynthia',
    label: 'Cynthia',
    team: ['spiritomb', 'roserade', 'gastrodon', 'lucario', 'milotic', 'garchomp'],
  },
  {
    key: 'iris',
    label: 'Iris',
    team: ['hydreigon', 'druddigon', 'lapras', 'aggron', 'archeops', 'haxorus'],
  },
  {
    key: 'steven',
    label: 'Steven',
    team: ['skarmory', 'claydol', 'aggron', 'cradily', 'armaldo', 'metagross'],
  },
  {
    key: 'n',
    label: 'N',
    team: ['zoroark', 'archeops', 'carracosta', 'vanilluxe', 'klinklang', 'reshiram'],
  },
  {
    key: 'lance',
    label: 'Lance',
    team: ['gyarados', 'dragonite', 'dragonite', 'dragonite', 'aerodactyl', 'charizard'],
  },
  {
    key: 'brendan',
    label: 'Brendan',
    team: ['sceptile', 'swellow', 'gardevoir', 'slaking', 'aggron', 'flygon'],
  },
];

export function getChampionByKey(key) {
  return CHAMPIONS.find((champion) => champion.key === key) ?? null;
}
