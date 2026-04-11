import { fetchJsonWithTimeout } from './pokeApi';
import { extractId, formatName, getStaticCardSprite } from './pokemonHelpers';

const API_BASE = 'https://pokeapi.co/api/v2';
const locationDetailCache = new Map();

function collectEncounterMethods(versionDetails) {
  const methods = new Set();

  versionDetails.forEach((detail) => {
    detail.encounter_details.forEach((encounter) => {
      if (encounter.method?.name) {
        methods.add(formatName(encounter.method.name));
      }
    });
  });

  return [...methods].sort((left, right) => left.localeCompare(right));
}

function collectVersions(versionDetails) {
  return [...new Set(versionDetails.map((detail) => formatName(detail.version.name)))];
}

export async function fetchLocationDetails(locationName) {
  if (!locationName) {
    throw new Error('Missing location name');
  }

  if (!locationDetailCache.has(locationName)) {
    locationDetailCache.set(
      locationName,
      fetchJsonWithTimeout(`${API_BASE}/location/${locationName}`, `location ${locationName}`)
        .then(async (location) => {
          const areaResults = await Promise.allSettled(
            location.areas.map((area) => fetchJsonWithTimeout(area.url, `location area ${area.name}`)),
          );
          const resolvedAreas = areaResults
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value);
          const speciesByName = new Map();

          resolvedAreas.forEach((area) => {
            area.pokemon_encounters.forEach((encounter) => {
              const pokemonId = extractId(encounter.pokemon.url);
              const existing = speciesByName.get(encounter.pokemon.name);

              if (!existing) {
                speciesByName.set(encounter.pokemon.name, {
                  id: pokemonId,
                  name: encounter.pokemon.name,
                  displayName: formatName(encounter.pokemon.name),
                  sprite: pokemonId ? getStaticCardSprite(pokemonId) : '',
                  methods: collectEncounterMethods(encounter.version_details),
                  versions: collectVersions(encounter.version_details),
                });
                return;
              }

              collectEncounterMethods(encounter.version_details).forEach((method) => existing.methods.push(method));
              collectVersions(encounter.version_details).forEach((version) => existing.versions.push(version));
            });
          });

          const pokemon = [...speciesByName.values()]
            .map((entry) => ({
              ...entry,
              methods: [...new Set(entry.methods)].sort((left, right) => left.localeCompare(right)),
              versions: [...new Set(entry.versions)].sort((left, right) => left.localeCompare(right)),
            }))
            .sort((left, right) => {
              if (left.id && right.id) {
                return left.id - right.id;
              }

              return left.displayName.localeCompare(right.displayName);
            });

          return {
            id: location.id,
            name: location.name,
            displayName: formatName(location.name),
            areaCount: location.areas.length,
            encounterAreaCount: resolvedAreas.filter((area) => area.pokemon_encounters.length > 0).length,
            pokemon,
          };
        })
        .catch((error) => {
          locationDetailCache.delete(locationName);
          throw error;
        }),
    );
  }

  return locationDetailCache.get(locationName);
}
