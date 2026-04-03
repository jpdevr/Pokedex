import { useEffect, useMemo, useState } from 'react';
import { CHAMPIONS } from './championData';
import { championSprites } from './championSprites';
import { capitalize } from './pokemonHelpers';
import { ALL_TYPES, TYPE_COLORS, getTypeMultiplier } from './typeData';

export default function TeamBuilderPopup({
  teams,
  selectedTeamId,
  onSelectTeam,
  onCreateTeam,
  onRenameTeam,
  onDeleteTeam,
  onRemoveMember,
  onStartBattle,
  battleLaunchState,
  battleLaunchError,
  onRequestClose,
  onCloseHoverChange = () => {},
}) {
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0] ?? null;
  const summary = buildTeamSummary(selectedTeam?.members ?? []);
  const [pendingChampionKey, setPendingChampionKey] = useState(null);
  const pendingChampion = useMemo(
    () => CHAMPIONS.find((champion) => champion.key === pendingChampionKey) ?? null,
    [pendingChampionKey],
  );
  const canStartBattle = (selectedTeam?.members.length ?? 0) > 0;

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape' && battleLaunchState !== 'ready') {
        onRequestClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [battleLaunchState, onRequestClose]);

  return (
    <div className="team-builder-layer" role="presentation" onClick={onRequestClose}>
      <div className="team-builder-dialog" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="team-builder-close"
          onClick={onRequestClose}
          onMouseEnter={() => onCloseHoverChange(true)}
          onMouseLeave={() => onCloseHoverChange(false)}
          onFocus={() => onCloseHoverChange(true)}
          onBlur={() => onCloseHoverChange(false)}
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
                <button
                  key={champion.key}
                  type="button"
                  className="team-builder-champion-button"
                  onClick={() => setPendingChampionKey(champion.key)}
                >
                  <figure className="team-builder-champion-card">
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
                </button>
              ))}
            </div>
            {battleLaunchError ? <p className="team-builder-battle-error">{battleLaunchError}</p> : null}
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

        {pendingChampion ? (
          <div className="team-builder-battle-confirm" role="dialog" aria-modal="true" aria-label={`Confirmar batalha contra ${pendingChampion.label}`}>
            <div className="team-builder-battle-card">
              <strong>Batalhar com {pendingChampion.label}?</strong>
              <p>
                Time atual: <span>{selectedTeam?.name ?? 'Sem time'}</span>
              </p>
              {!canStartBattle ? <small>Adicione pelo menos um Pokemon ao time antes de batalhar.</small> : null}
              {battleLaunchError ? <small>{battleLaunchError}</small> : null}
              <div className="team-builder-battle-actions">
                <button type="button" className="team-builder-battle-cancel" onClick={() => setPendingChampionKey(null)}>
                  Cancelar
                </button>
                <button
                  type="button"
                  className="team-builder-battle-start"
                  onClick={() => {
                    onStartBattle(pendingChampion.key);
                    setPendingChampionKey(null);
                  }}
                  disabled={!canStartBattle || battleLaunchState === 'loading'}
                >
                  {battleLaunchState === 'loading' ? 'Montando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {battleLaunchState === 'loading' ? (
          <div className="team-builder-battle-confirm" role="presentation">
            <div className="team-builder-battle-card">
              <strong>Montando batalha...</strong>
              <p>Carregando golpes, stats e o time do champion.</p>
            </div>
          </div>
        ) : null}
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
  return getTypeMultiplier(attackType, defenderTypes);
}

function getAttackMultiplier(attackType, defenderType) {
  return getTypeMultiplier(attackType, [defenderType]);
}
