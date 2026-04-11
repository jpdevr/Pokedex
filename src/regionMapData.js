const REGION_ORDER = ['Kanto', 'Johto', 'Hoenn', 'Sinnoh', 'Unova', 'Kalos', 'Alola', 'Galar', 'Paldea'];

const REGION_CONFIGS = {
  Kanto: {
    label: 'Kanto',
    hotspots: [
      { id: 'pallet-town', label: 'Pallet Town', kind: 'City', apiLocation: 'pallet-town', x: 13.2, y: 70.6, width: 5.1, height: 4.5 },
      { id: 'kanto-route-1', label: 'Route 1', kind: 'Route', apiLocation: 'kanto-route-1', x: 13.8, y: 60.2, width: 4.2, height: 11.2 },
      { id: 'viridian-city', label: 'Viridian City', kind: 'City', apiLocation: 'viridian-city', x: 14.3, y: 51.3, width: 5.4, height: 4.8 },
      { id: 'pewter-city', label: 'Pewter City', kind: 'City', apiLocation: 'pewter-city', x: 16.1, y: 31.1, width: 5.7, height: 5.1 },
      { id: 'celadon-city', label: 'Celadon City', kind: 'City', apiLocation: 'celadon-city', x: 44.5, y: 33.1, width: 6.6, height: 5.4 },
      { id: 'cerulean-city', label: 'Cerulean City', kind: 'City', apiLocation: 'cerulean-city', x: 78.4, y: 24.8, width: 6.1, height: 5.1 },
      { id: 'lavender-town', label: 'Lavender Town', kind: 'Town', apiLocation: 'lavender-town', x: 80.1, y: 39.6, width: 5.6, height: 5.3 },
      { id: 'fuchsia-city', label: 'Fuchsia City', kind: 'City', apiLocation: 'fuchsia-city', x: 73.8, y: 57.8, width: 6.1, height: 5.5 },
      { id: 'cinnabar-island', label: 'Cinnabar Island', kind: 'Island', apiLocation: 'cinnabar-island', x: 12.8, y: 88.7, width: 6.5, height: 5.5 },
    ],
  },
  Johto: {
    label: 'Johto',
    hotspots: [
      { id: 'new-bark-town', label: 'New Bark Town', kind: 'Town', apiLocation: 'new-bark-town', x: 86.6, y: 61.6, width: 5.2, height: 5.2 },
      { id: 'johto-route-29', label: 'Route 29', kind: 'Route', apiLocation: 'johto-route-29', x: 78.8, y: 58.8, width: 7.8, height: 4.8 },
      { id: 'violet-city', label: 'Violet City', kind: 'City', apiLocation: 'violet-city', x: 71.1, y: 36.7, width: 5.6, height: 5.4 },
      { id: 'goldenrod-city', label: 'Goldenrod City', kind: 'City', apiLocation: 'goldenrod-city', x: 49.5, y: 40.3, width: 7.5, height: 6.1 },
      { id: 'ecruteak-city', label: 'Ecruteak City', kind: 'City', apiLocation: 'ecruteak-city', x: 56.3, y: 31.8, width: 6.2, height: 5.3 },
      { id: 'olivine-city', label: 'Olivine City', kind: 'City', apiLocation: 'olivine-city', x: 33.2, y: 45.7, width: 6.6, height: 5.6 },
      { id: 'mahogany-town', label: 'Mahogany Town', kind: 'Town', apiLocation: 'mahogany-town', x: 76.5, y: 26.2, width: 5.8, height: 5.1 },
      { id: 'blackthorn-city', label: 'Blackthorn City', kind: 'City', apiLocation: 'blackthorn-city', x: 88.6, y: 30.6, width: 6.2, height: 5.4 },
      { id: 'lake-of-rage', label: 'Lake of Rage', kind: 'Lake', apiLocation: 'lake-of-rage', x: 69.6, y: 12.8, width: 8.8, height: 6.8 },
    ],
  },
  Hoenn: {
    label: 'Hoenn',
    hotspots: [
      { id: 'littleroot-town', label: 'Littleroot Town', kind: 'Town', apiLocation: 'littleroot-town', x: 10.8, y: 89.6, width: 5.6, height: 5.1 },
      { id: 'rustboro-city', label: 'Rustboro City', kind: 'City', apiLocation: 'rustboro-city', x: 14.2, y: 17.6, width: 6.7, height: 5.9 },
      { id: 'dewford-town', label: 'Dewford Town', kind: 'Town', apiLocation: 'dewford-town', x: 7.6, y: 54.8, width: 6.2, height: 5.7 },
      { id: 'slateport-city', label: 'Slateport City', kind: 'City', apiLocation: 'slateport-city', x: 24.1, y: 72.8, width: 6.4, height: 6.2 },
      { id: 'mauville-city', label: 'Mauville City', kind: 'City', apiLocation: 'mauville-city', x: 29.0, y: 51.6, width: 6.2, height: 5.9 },
      { id: 'hoenn-route-110', label: 'Route 110', kind: 'Route', apiLocation: 'hoenn-route-110', x: 25.8, y: 63.6, width: 5.1, height: 12.7 },
      { id: 'fortree-city', label: 'Fortree City', kind: 'City', apiLocation: 'fortree-city', x: 54.0, y: 23.1, width: 6.1, height: 5.5 },
      { id: 'lilycove-city', label: 'Lilycove City', kind: 'City', apiLocation: 'lilycove-city', x: 82.1, y: 18.7, width: 7.2, height: 5.8 },
      { id: 'sootopolis-city', label: 'Sootopolis City', kind: 'City', apiLocation: 'sootopolis-city', x: 76.9, y: 48.0, width: 6.7, height: 5.7 },
      { id: 'ever-grande-city', label: 'Ever Grande City', kind: 'City', apiLocation: 'ever-grande-city', x: 94.1, y: 45.3, width: 5.4, height: 9.8 },
    ],
  },
  Sinnoh: {
    label: 'Sinnoh',
    hotspots: [
      { id: 'twinleaf-town', label: 'Twinleaf Town', kind: 'Town', apiLocation: 'twinleaf-town', x: 17.5, y: 74.3, width: 5.6, height: 5.5 },
      { id: 'sandgem-town', label: 'Sandgem Town', kind: 'Town', apiLocation: 'sandgem-town', x: 27.5, y: 76.8, width: 5.7, height: 5.4 },
      { id: 'jubilife-city', label: 'Jubilife City', kind: 'City', apiLocation: 'jubilife-city', x: 18.5, y: 64.0, width: 7.4, height: 6.4 },
      { id: 'oreburgh-city', label: 'Oreburgh City', kind: 'City', apiLocation: 'oreburgh-city', x: 37.8, y: 70.1, width: 6.7, height: 5.7 },
      { id: 'hearthome-city', label: 'Hearthome City', kind: 'City', apiLocation: 'hearthome-city', x: 43.7, y: 55.7, width: 6.8, height: 6.3 },
      { id: 'sinnoh-route-209', label: 'Route 209', kind: 'Route', apiLocation: 'sinnoh-route-209', x: 42.7, y: 62.4, width: 4.9, height: 10.3 },
      { id: 'veilstone-city', label: 'Veilstone City', kind: 'City', apiLocation: 'veilstone-city', x: 70.3, y: 53.8, width: 8.1, height: 6.1 },
      { id: 'pastoria-city', label: 'Pastoria City', kind: 'City', apiLocation: 'pastoria-city', x: 63.2, y: 76.7, width: 6.2, height: 5.8 },
      { id: 'snowpoint-city', label: 'Snowpoint City', kind: 'City', apiLocation: 'snowpoint-city', x: 63.2, y: 18.8, width: 5.8, height: 5.3 },
      { id: 'sunyshore-city', label: 'Sunyshore City', kind: 'City', apiLocation: 'sunyshore-city', x: 91.7, y: 67.4, width: 6.3, height: 5.9 },
    ],
  },
  Unova: {
    label: 'Unova',
    hotspots: [
      { id: 'nuvema-town', label: 'Nuvema Town', kind: 'Town', apiLocation: 'nuvema-town', x: 9.5, y: 83.8, width: 5.6, height: 5.5 },
      { id: 'accumula-town', label: 'Accumula Town', kind: 'Town', apiLocation: 'accumula-town', x: 17.0, y: 72.8, width: 5.6, height: 5.2 },
      { id: 'striaton-city', label: 'Striaton City', kind: 'City', apiLocation: 'striaton-city', x: 18.0, y: 59.0, width: 6.6, height: 6.0 },
      { id: 'nacrene-city', label: 'Nacrene City', kind: 'City', apiLocation: 'nacrene-city', x: 30.4, y: 53.6, width: 5.8, height: 5.6 },
      { id: 'castelia-city', label: 'Castelia City', kind: 'City', apiLocation: 'castelia-city', x: 50.7, y: 83.5, width: 10.2, height: 10.8 },
      { id: 'nimbasa-city', label: 'Nimbasa City', kind: 'City', apiLocation: 'nimbasa-city', x: 43.5, y: 63.0, width: 7.1, height: 6.2 },
      { id: 'unova-route-4', label: 'Route 4', kind: 'Route', apiLocation: 'unova-route-4', x: 47.9, y: 61.2, width: 6.1, height: 9.6 },
      { id: 'driftveil-city', label: 'Driftveil City', kind: 'City', apiLocation: 'driftveil-city', x: 31.4, y: 74.0, width: 6.8, height: 6.1 },
      { id: 'opelucid-city', label: 'Opelucid City', kind: 'City', apiLocation: 'opelucid-city', x: 79.2, y: 52.1, width: 6.1, height: 5.7 },
      { id: 'humilau-city', label: 'Humilau City', kind: 'City', apiLocation: 'humilau-city', x: 90.8, y: 69.6, width: 6.0, height: 6.0 },
    ],
  },
  Kalos: {
    label: 'Kalos',
    hotspots: [
      { id: 'vaniville-town', label: 'Vaniville Town', kind: 'Town', apiLocation: 'vaniville-town', x: 82.7, y: 86.2, width: 5.9, height: 5.8 },
      { id: 'santalune-city', label: 'Santalune City', kind: 'City', apiLocation: 'santalune-city', x: 70.4, y: 76.4, width: 6.4, height: 5.7 },
      { id: 'lumiose-city', label: 'Lumiose City', kind: 'City', apiLocation: 'lumiose-city', x: 53.6, y: 39.8, width: 10.4, height: 10.0 },
      { id: 'camphrier-town', label: 'Camphrier Town', kind: 'Town', apiLocation: 'camphrier-town', x: 49.6, y: 28.6, width: 6.5, height: 5.7 },
      { id: 'coumarine-city', label: 'Coumarine City', kind: 'City', apiLocation: 'coumarine-city', x: 13.4, y: 39.9, width: 6.3, height: 5.8 },
      { id: 'laverre-city', label: 'Laverre City', kind: 'City', apiLocation: 'laverre-city', x: 86.3, y: 33.6, width: 6.0, height: 5.6 },
      { id: 'anistar-city', label: 'Anistar City', kind: 'City', apiLocation: 'anistar-city', x: 86.7, y: 56.7, width: 5.9, height: 5.5 },
      { id: 'kalos-route-14', label: 'Route 14', kind: 'Route', apiLocation: 'kalos-route-14', x: 80.1, y: 46.8, width: 5.0, height: 9.0 },
      { id: 'snowbelle-city', label: 'Snowbelle City', kind: 'City', apiLocation: 'snowbelle-city', x: 94.1, y: 19.3, width: 5.7, height: 5.2 },
      { id: 'kiloude-city', label: 'Kiloude City', kind: 'City', apiLocation: 'kiloude-city', x: 26.3, y: 5.8, width: 7.1, height: 7.4 },
    ],
  },
  Alola: {
    label: 'Alola',
    hotspots: [
      { id: 'iki-town', label: 'Iki Town', kind: 'Town', apiLocation: 'iki-town', x: 24.4, y: 31.6, width: 6.6, height: 5.5 },
      { id: 'hauoli-city', label: 'Hauoli City', kind: 'City', apiLocation: 'hauoli-city', x: 18.2, y: 38.2, width: 7.1, height: 6.0 },
      { id: 'alola-route-1', label: 'Route 1', kind: 'Route', apiLocation: 'alola-route-1', x: 21.8, y: 35.2, width: 5.7, height: 11.5 },
      { id: 'heahea-city', label: 'Heahea City', kind: 'City', apiLocation: 'heahea-city', x: 66.8, y: 44.2, width: 7.0, height: 6.1 },
      { id: 'konikoni-city', label: 'Konikoni City', kind: 'City', apiLocation: 'konikoni-city', x: 72.2, y: 28.7, width: 6.1, height: 5.6 },
      { id: 'malie-city', label: 'Malie City', kind: 'City', apiLocation: 'malie-city', x: 85.4, y: 56.6, width: 6.0, height: 5.7 },
      { id: 'po-town', label: 'Po Town', kind: 'Town', apiLocation: 'po-town', x: 77.0, y: 45.4, width: 5.9, height: 5.5 },
      { id: 'aether-paradise', label: 'Aether Paradise', kind: 'Facility', apiLocation: 'aether-paradise', x: 53.2, y: 49.0, width: 6.6, height: 5.7 },
      { id: 'mount-lanakila', label: 'Mount Lanakila', kind: 'Mountain', apiLocation: 'mount-lanakila', x: 82.1, y: 69.3, width: 8.3, height: 8.5 },
      { id: 'seafolk-village', label: 'Seafolk Village', kind: 'Village', apiLocation: 'seafolk-village', x: 88.2, y: 76.2, width: 6.0, height: 6.0 },
    ],
  },
  Galar: {
    label: 'Galar',
    hotspots: [
      { id: 'postwick', label: 'Postwick', kind: 'Town', apiLocation: 'postwick', x: 50.1, y: 88.6, width: 6.7, height: 4.6 },
      { id: 'galar-route-1', label: 'Route 1', kind: 'Route', apiLocation: 'galar-route-1', x: 50.0, y: 84.2, width: 5.1, height: 8.1 },
      { id: 'wedgehurst', label: 'Wedgehurst', kind: 'Town', apiLocation: 'wedgehurst', x: 50.2, y: 80.7, width: 6.4, height: 4.5 },
      { id: 'motostoke', label: 'Motostoke', kind: 'City', apiLocation: 'motostoke', x: 50.1, y: 61.9, width: 8.5, height: 5.2 },
      { id: 'hammerlocke', label: 'Hammerlocke', kind: 'City', apiLocation: 'hammerlocke', x: 50.1, y: 47.4, width: 7.2, height: 4.8 },
      { id: 'stow-on-side', label: 'Stow-on-Side', kind: 'Town', apiLocation: 'stow-on-side', x: 38.0, y: 54.6, width: 6.3, height: 5.0 },
      { id: 'ballonlea', label: 'Ballonlea', kind: 'Town', apiLocation: 'ballonlea', x: 58.8, y: 38.8, width: 5.8, height: 4.8 },
      { id: 'circhester', label: 'Circhester', kind: 'City', apiLocation: 'circhester', x: 73.1, y: 35.6, width: 6.8, height: 5.2 },
      { id: 'spikemuth', label: 'Spikemuth', kind: 'City', apiLocation: 'spikemuth', x: 32.5, y: 18.8, width: 6.0, height: 4.6 },
      { id: 'wyndon', label: 'Wyndon', kind: 'City', apiLocation: 'wyndon', x: 59.4, y: 8.6, width: 8.2, height: 5.1 },
    ],
  },
  Paldea: {
    label: 'Paldea',
    hotspots: [
      { id: 'cabo-poco', label: 'Cabo Poco', kind: 'Town', apiLocation: 'cabo-poco', x: 47.5, y: 90.1, width: 6.0, height: 5.3 },
      { id: 'poco-path', label: 'Poco Path', kind: 'Route', apiLocation: 'poco-path', x: 49.0, y: 86.2, width: 4.5, height: 8.5 },
      { id: 'los-platos', label: 'Los Platos', kind: 'Town', apiLocation: 'los-platos', x: 50.4, y: 82.6, width: 5.8, height: 5.1 },
      { id: 'mesagoza', label: 'Mesagoza', kind: 'City', apiLocation: 'mesagoza', x: 46.7, y: 68.5, width: 10.6, height: 8.3 },
      { id: 'cortondo', label: 'Cortondo', kind: 'Town', apiLocation: 'cortondo', x: 26.8, y: 57.0, width: 6.2, height: 5.5 },
      { id: 'cascarrafa', label: 'Cascarrafa', kind: 'City', apiLocation: 'cascarrafa', x: 18.1, y: 54.0, width: 7.1, height: 5.8 },
      { id: 'medali', label: 'Medali', kind: 'City', apiLocation: 'medali', x: 57.5, y: 47.3, width: 6.2, height: 5.8 },
      { id: 'levincia', label: 'Levincia', kind: 'City', apiLocation: 'levincia', x: 80.7, y: 56.7, width: 6.8, height: 6.0 },
      { id: 'montenevera', label: 'Montenevera', kind: 'Town', apiLocation: 'montenevera', x: 67.6, y: 27.4, width: 5.9, height: 5.4 },
      { id: 'area-zero', label: 'Area Zero', kind: 'Crater', apiLocation: 'area-zero', x: 46.6, y: 40.1, width: 17.2, height: 14.8 },
    ],
  },
};

export function buildRegionMaps(modules) {
  const entries = Object.entries(modules)
    .map(([filePath, src]) => {
      const fileName = filePath.split('/').pop() || filePath;
      const baseName = fileName.replace(/\.[^/.]+$/, '');
      const config = REGION_CONFIGS[baseName];

      if (!config) {
        return null;
      }

      return {
        id: fileName,
        key: baseName.toLowerCase(),
        label: config.label,
        src,
        hotspots: config.hotspots,
      };
    })
    .filter(Boolean);

  return REGION_ORDER.map((label) => entries.find((entry) => entry.label === label)).filter(Boolean);
}
