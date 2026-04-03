import { getChampionByKey } from './championData';
import { getBattleBackSprite, getBattleFrontSprite, formatName } from './pokemonHelpers';
import { fetchJsonWithTimeout } from './pokeApi';

const API_BASE = 'https://pokeapi.co/api/v2';
const BATTLE_LEVEL = 50;
const MOVE_DETAIL_CACHE = new Map();
const BATTLE_POKEMON_CACHE = new Map();
const HARD_BANNED_MOVE_NAMES = new Set([
  'splash',
  'celebrate',
  'hold-hands',
  'metronome',
  'copycat',
  'assist',
  'sleep-talk',
  'mirror-move',
  'me-first',
  'chatter',
]);

export async function buildBattleSetup(championKey, playerMembers) {
  const champion = getChampionByKey(championKey);

  if (!champion) {
    throw new Error('Champion nao encontrado.');
  }

  if (!playerMembers.length) {
    throw new Error('Seu time precisa ter pelo menos um Pokemon.');
  }

  const [playerTeam, opponentTeam] = await Promise.all([
    Promise.all(playerMembers.map((member, index) => buildBattlePokemon(member.pokemonId, `player-${member.id}-${index}`))),
    Promise.all(champion.team.map((species, index) => buildBattlePokemon(species, `enemy-${champion.key}-${index}`))),
  ]);

  return {
    champion: {
      key: champion.key,
      label: champion.label,
    },
    playerTeam,
    opponentTeam,
  };
}

async function buildBattlePokemon(identifier, battleId) {
  const cacheKey = String(identifier).toLowerCase();

  if (!BATTLE_POKEMON_CACHE.has(cacheKey)) {
    BATTLE_POKEMON_CACHE.set(cacheKey, fetchBattlePokemonProfile(identifier));
  }

  const profile = await BATTLE_POKEMON_CACHE.get(cacheKey);

  return {
    ...profile,
    battleId,
    currentHp: profile.maxHp,
    moves: profile.moves.map((move) => ({ ...move })),
  };
}

async function fetchBattlePokemonProfile(identifier) {
  const pokemon = await fetchJsonWithTimeout(`${API_BASE}/pokemon/${identifier}`, `pokemon ${identifier}`);
  const types = pokemon.types.map((item) => item.type.name);
  const moves = await pickBattleMoves(pokemon, types);
  const stats = buildBattleStats(pokemon.stats);

  return {
    pokemonId: pokemon.id,
    name: pokemon.name,
    displayName: formatName(pokemon.name),
    level: BATTLE_LEVEL,
    maxHp: stats.hp,
    stats,
    types,
    cryUrl: pokemon.cries?.legacy ?? pokemon.cries?.latest ?? null,
    spriteFront: getBattleFrontSprite(pokemon),
    spriteBack: getBattleBackSprite(pokemon),
    moves,
  };
}

async function pickBattleMoves(pokemon, pokemonTypes) {
  const learnableMoves = pokemon.moves
    .filter((entry) =>
      entry.version_group_details.some((detail) => {
        const method = detail.move_learn_method.name;
        return (
          method !== 'egg' &&
          method !== 'stadium-surfing-pikachu' &&
          (method !== 'level-up' || detail.level_learned_at <= BATTLE_LEVEL)
        );
      }),
    )
    .map((entry) => ({
      name: entry.move.name,
      url: entry.move.url,
    }))
    .filter((entry, index, collection) => collection.findIndex((item) => item.name === entry.name) === index);

  const moveResults = await Promise.allSettled(
    learnableMoves.map((entry) => fetchMoveDetail(entry.url)),
  );

  const movePool = moveResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value)
    .filter((move) => !isMoveHardBanned(move));

  const damagingMoves = movePool
    .filter((move) => move.damageClass !== 'status' && move.power > 0)
    .sort((a, b) => scoreMove(b, pokemonTypes) - scoreMove(a, pokemonTypes));

  const selectedDamagingMoves = pickRandomEntries(damagingMoves.slice(0, Math.min(10, damagingMoves.length)), 4);
  const ensuredDamaging = [...selectedDamagingMoves];

  if (ensuredDamaging.length < 2) {
    const strongestMoves = damagingMoves.slice(0, 2);
    strongestMoves.forEach((move) => {
      if (!ensuredDamaging.some((entry) => entry.name === move.name)) {
        ensuredDamaging.push(move);
      }
    });
  }

  if (ensuredDamaging.length < 4) {
    movePool
      .filter((move) => !ensuredDamaging.some((entry) => entry.name === move.name))
      .slice(0, 4 - ensuredDamaging.length)
      .forEach((move) => ensuredDamaging.push(move));
  }

  if (!ensuredDamaging.length) {
    throw new Error(`Nenhum ataque valido foi encontrado para ${pokemon.name}.`);
  }

  return ensuredDamaging.slice(0, 4).map((move) => ({
    id: move.name,
    name: move.name,
    displayName: move.displayName,
    type: move.type,
    power: move.power,
    accuracy: move.accuracy,
    damageClass: move.damageClass,
    priority: move.priority,
  }));
}

async function fetchMoveDetail(url) {
  if (!MOVE_DETAIL_CACHE.has(url)) {
    MOVE_DETAIL_CACHE.set(
      url,
      fetchJsonWithTimeout(url, `move ${url}`).then((move) => ({
        name: move.name,
        displayName: formatName(move.name),
        type: move.type?.name ?? 'normal',
        power: move.power ?? 0,
        accuracy: move.accuracy ?? 100,
        damageClass: move.damage_class?.name ?? 'status',
        priority: move.priority ?? 0,
      })),
    );
  }

  return MOVE_DETAIL_CACHE.get(url);
}

function isMoveHardBanned(move) {
  return HARD_BANNED_MOVE_NAMES.has(move.name);
}

function scoreMove(move, pokemonTypes) {
  const stabBonus = pokemonTypes.includes(move.type) ? 24 : 0;
  const accuracyBonus = (move.accuracy ?? 100) * 0.22;
  const priorityBonus = (move.priority ?? 0) * 16;
  return (move.power ?? 0) + stabBonus + accuracyBonus + priorityBonus;
}

function pickRandomEntries(entries, count) {
  const shuffled = [...entries];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  return shuffled.slice(0, count);
}

function buildBattleStats(stats) {
  const baseStats = stats.reduce((accumulator, item) => {
    accumulator[item.stat.name] = item.base_stat;
    return accumulator;
  }, {});

  return {
    hp: calculateBattleHp(baseStats.hp ?? 60),
    attack: calculateBattleStat(baseStats.attack ?? 50),
    defense: calculateBattleStat(baseStats.defense ?? 50),
    specialAttack: calculateBattleStat(baseStats['special-attack'] ?? 50),
    specialDefense: calculateBattleStat(baseStats['special-defense'] ?? 50),
    speed: calculateBattleStat(baseStats.speed ?? 50),
  };
}

function calculateBattleHp(baseStat) {
  return Math.floor(((2 * baseStat + 31) * BATTLE_LEVEL) / 100) + BATTLE_LEVEL + 10;
}

function calculateBattleStat(baseStat) {
  return Math.floor(((2 * baseStat + 31) * BATTLE_LEVEL) / 100) + 5;
}
