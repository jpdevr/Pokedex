const championSpriteModules = import.meta.glob('./Champions/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

export const championSprites = Object.entries(championSpriteModules).reduce(
  (spriteMap, [path, source]) => {
    const fileName = path.split('/').pop() ?? '';
    const normalizedName = fileName.replace(/\.[^.]+$/, '').toLowerCase();
    spriteMap[normalizedName] = source;
    return spriteMap;
  },
  {},
);
