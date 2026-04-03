import { useEffect } from 'react';

const championSpriteModules = import.meta.glob('./Champions/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

const CHAMPIONS = [
  { key: 'red', label: 'Red' },
  { key: 'green', label: 'Green' },
  { key: 'cynthia', label: 'Cynthia' },
  { key: 'iris', label: 'Iris' },
  { key: 'steven', label: 'Steven' },
  { key: 'n', label: 'N' },
  { key: 'lance', label: 'Lance' },
  { key: 'brendan', label: 'Brendan' },
];

const championSprites = Object.entries(championSpriteModules).reduce((spriteMap, [path, source]) => {
  const fileName = path.split('/').pop() ?? '';
  const normalizedName = fileName.replace(/\.[^.]+$/, '').toLowerCase();
  spriteMap[normalizedName] = source;
  return spriteMap;
}, {});

const TYPE_COLORS = {
  normal: '#9fa19f',
  fire: '#e86d3e',
  water: '#5090d6',
  electric: '#f4d23c',
  grass: '#63bc5a',
  ice: '#73cec0',
  fighting: '#ce416b',
  poison: '#b567ce',
  ground: '#d97845',
  flying: '#89aae3',
  psychic: '#fa7179',
  bug: '#91c12f',
  rock: '#c5b78c',
  ghost: '#5269ad',
  dragon: '#0b6dc3',
  dark: '#5a5465',
  steel: '#5a8ea2',
  fairy: '#ec8fe6',
};

const TYPE_CHART = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2, steel: 0.5, ice: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const ALL_TYPES = Object.keys(TYPE_COLORS);

export default function TeamBuilderPopup({
  teams,
  selectedTeamId,
  onSelectTeam,
  onCreateTeam,
  onRenameTeam,
  onDeleteTeam,
  onRemoveMember,
  onRequestClose,
}) {
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0] ?? null;
  const summary = buildTeamSummary(selectedTeam?.members ?? []);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        onRequestClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onRequestClose]);

  return (
    <div className="team-builder-layer" role="presentation" onClick={onRequestClose}>
      <div className="team-builder-dialog" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="team-builder-close"
          onClick={onRequestClose}
          aria-label="Fechar team builder"
        >
          x
        </button>
        <div
          className="team-builder-popup"
          role="dialog"
          aria-modal="true"
          aria-label="Team builder Pokemon"
        >
          <div className="team-builder-champions">
            <div className="team-builder-champion-strip">
              {CHAMPIONS.map((champion) => (
                <figure key={champion.key} className="team-builder-champion-card">
                  <div className="team-builder-champion-sprite-wrap">
                    {championSprites[champion.key] ? (
                      <img
                        src={championSprites[champion.key]}
                        alt={champion.label}
                        className="team-builder-champion-sprite pixel-art"
                      />
                    ) : (
                      <div className="team-builder-champion-missing" aria-hidden="true" />
                    )}
                  </div>
                  <figcaption className="team-builder-champion-label">{champion.label}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          <div className="team-builder-body">
            <section className="team-builder-teams">
              <div className="team-builder-panel-title">
                <strong>Times</strong>
                <button type="button" className="team-builder-create" onClick={onCreateTeam}>
                  Novo
                </button>
              </div>

              <div className="team-builder-team-list">
                {teams.map((team) => {
                  const isActive = team.id === selectedTeamId;

                  return (
                    <div key={team.id} className={isActive ? 'team-builder-team-card active' : 'team-builder-team-card'}>
                      <button type="button" className="team-builder-team-select" onClick={() => onSelectTeam(team.id)}>
                        <span>{team.name || 'Sem nome'}</span>
                        <small>{team.members.length}/6</small>
                      </button>

                      {isActive ? (
                        <>
                          <input
                            type="text"
                            className="team-builder-team-input"
                            value={team.name}
                            maxLength={24}
                            onChange={(event) => onRenameTeam(team.id, event.target.value)}
                            aria-label={`Renomear ${team.name || 'time'}`}
                          />
                          <div className="team-builder-team-actions">
                            <span className="team-builder-team-edit-tag">Editando nome</span>
                            <button
                              type="button"
                              className="team-builder-team-delete"
                              onClick={() => onDeleteTeam(team.id)}
                            >
                              Excluir
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="team-builder-team-view">
              <div className="team-builder-panel-title">
                <strong>{selectedTeam?.name || 'Time'}</strong>
                <small>6 slots</small>
              </div>

              <div className="team-builder-team-content">
                <div className="team-builder-slots">
                  {Array.from({ length: 6 }, (_, index) => {
                    const member = selectedTeam?.members[index] ?? null;

                    return (
                      <div key={`${selectedTeam?.id ?? 'team'}-${index}`} className={member ? 'team-builder-slot filled' : 'team-builder-slot'}>
                        {member ? (
                          <>
                            <button
                              type="button"
                              className="team-builder-slot-remove"
                              onClick={() => onRemoveMember(selectedTeam.id, index)}
                              aria-label={`Remover ${member.displayName} do time`}
                            >
                              x
                            </button>
                            <img src={member.sprite} alt={member.displayName} className="team-builder-slot-sprite pixel-art" />
                            <strong>{member.displayName}</strong>
                          </>
                        ) : (
                          <span>Vazio</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="team-builder-analysis">
                  <AnalysisBlock title="Maiores Desvantagens" entries={summary.weaknesses} />
                  <AnalysisBlock title="Maiores Vantagens" entries={summary.coverage} />
                  <AnalysisBlock title="Melhores Resistencias" entries={summary.resistances} />
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisBlock({ title, entries }) {
  return (
    <div className="team-builder-analysis-card">
      <span>{title}</span>
      {entries.length ? (
        <div className="team-builder-type-list">
          {entries.map((entry) => (
            <div key={`${title}-${entry.type}`} className="team-builder-type-row">
              <span className="team-builder-type-badge" style={{ '--type-color': TYPE_COLORS[entry.type] ?? '#74828f' }}>
                {capitalize(entry.type)}
              </span>
              <strong>{entry.value}x</strong>
            </div>
          ))}
        </div>
      ) : (
        <small>Adicione Pokemon para gerar a leitura do time.</small>
      )}
    </div>
  );
}

function buildTeamSummary(members) {
  const membersWithTypes = members.filter((member) => member.types?.length);

  if (!membersWithTypes.length) {
    return { weaknesses: [], resistances: [], coverage: [] };
  }

  const weaknessMap = new Map();
  const resistanceMap = new Map();
  const coverageMap = new Map();
  const availableAttackTypes = new Set();

  membersWithTypes.forEach((member) => {
    member.types.forEach((type) => {
      availableAttackTypes.add(type);
    });

    ALL_TYPES.forEach((attackType) => {
      const multiplier = getMultiplier(attackType, member.types);

      if (multiplier > 1) {
        weaknessMap.set(attackType, (weaknessMap.get(attackType) ?? 0) + 1);
      } else if (multiplier < 1) {
        resistanceMap.set(attackType, (resistanceMap.get(attackType) ?? 0) + 1);
      }
    });
  });

  availableAttackTypes.forEach((attackType) => {
    const coverage = ALL_TYPES.reduce((count, defenderType) => {
      return count + (getAttackMultiplier(attackType, defenderType) > 1 ? 1 : 0);
    }, 0);

    coverageMap.set(attackType, coverage);
  });

  return {
    weaknesses: sortEntries(weaknessMap),
    resistances: sortEntries(resistanceMap),
    coverage: sortEntries(coverageMap),
  };
}

function sortEntries(valueMap) {
  return [...valueMap.entries()]
    .map(([type, value]) => ({ type, value }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value || a.type.localeCompare(b.type))
    .slice(0, 3);
}

function getMultiplier(attackType, defenderTypes) {
  return defenderTypes.reduce((acc, defenderType) => acc * getAttackMultiplier(attackType, defenderType), 1);
}

function getAttackMultiplier(attackType, defenderType) {
  return TYPE_CHART[attackType]?.[defenderType] ?? 1;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
