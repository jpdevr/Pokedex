const REGION_ORDER = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'];

const REGION_LABELS = {
  Kanto: 'Kanto',
  Johto: 'Johto',
  Hoenn: 'Hoenn',
  Sinnoh: 'Sinnoh',
  Unova: 'Unova',
  Kalos: 'Kalos',
  Alola: 'Alola',
  Galar: 'Galar',
  Paldea: 'Paldea',
};

export function buildRegionMaps(modules) {
  const entries = Object.entries(modules)
    .map(([filePath, src]) => {
      const fileName = filePath.split('/').pop() || filePath;
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      const label = REGION_LABELS[baseName];

      if (!label) {
        return null;
      }

      return {
        id: fileName,
        key: baseName.toLowerCase(),
        label,
        src,
      };
    })
    .filter(Boolean);

  return REGION_ORDER.map((label) => entries.find((entry) => entry.label === label)).filter(Boolean);
}
