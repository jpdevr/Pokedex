export function extractId(url) {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

export function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatName(value) {
  return value
    .split('-')
    .map((part) => capitalize(part))
    .join(' ');
}

export function formatId(id) {
  return String(id).padStart(4, '0');
}

export function cleanText(text) {
  return text.replace(/\f|\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getAnimatedPixelSprite(pokemon) {
  return (
    pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default ??
    pokemon.sprites.other?.showdown?.front_default ??
    pokemon.sprites.versions?.['generation-v']?.['black-white']?.front_default ??
    pokemon.sprites.versions?.['generation-iv']?.['heartgold-soulsilver']?.front_default ??
    pokemon.sprites.front_default
  );
}

export function getBattleFrontSprite(pokemon) {
  return getAnimatedPixelSprite(pokemon);
}

export function getBattleBackSprite(pokemon) {
  return (
    pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.back_default ??
    pokemon.sprites.other?.showdown?.back_default ??
    pokemon.sprites.versions?.['generation-v']?.['black-white']?.back_default ??
    pokemon.sprites.versions?.['generation-iv']?.['heartgold-soulsilver']?.back_default ??
    pokemon.sprites.back_default ??
    pokemon.sprites.versions?.['generation-v']?.['black-white']?.front_default ??
    pokemon.sprites.front_default
  );
}

export function getCardSprite(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;
}

export function getStaticCardSprite(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/${id}.png`;
}
