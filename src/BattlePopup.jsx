import { useEffect, useRef, useState } from 'react';
import pokeballClose from './assets/PokeballClose.png';
import pokeballOpen from './assets/PokeballOpen.png';
import pokeballSemiOpen from './assets/PokeballSemiOpen.png';
import { championSprites } from './championSprites';
import { capitalize } from './pokemonHelpers';
import { TYPE_COLORS, getTypeMultiplier } from './typeData';

const ATTACK_ANNOUNCE_DELAY_MS = 0;
const EFFECT_MESSAGE_DELAY_MS = 0;
const HP_DROP_DELAY_MS = 0;
const FAINT_MESSAGE_DELAY_MS = 0;
const BATTLE_INTRO_SEQUENCE = [
  { key: 'enemy-trainer-enter', delay: 760 },
  { key: 'enemy-pokeball-throw', delay: 720 },
  { key: 'enemy-pokemon-materialize', delay: 860 },
  { key: 'enemy-status-reveal', delay: 320 },
  { key: 'player-pokeball-throw', delay: 640 },
  { key: 'player-pokemon-materialize', delay: 860 },
  { key: 'player-status-reveal', delay: 320 },
  { key: 'complete', delay: 0 },
];

export default function BattlePopup({ battleConfig, onClose, onComplete, onButtonClick = () => {} }) {
  const [battleState, setBattleState] = useState(() => createInitialBattleState(battleConfig));
  const [introPhase, setIntroPhase] = useState('initial');
  const cryAudioRef = useRef(null);
  const introTimeoutsRef = useRef([]);

  function handleUiButtonClick(callback) {
    onButtonClick();
    callback();
  }

  useEffect(() => {
    setBattleState(createInitialBattleState(battleConfig));
    setIntroPhase('initial');
  }, [battleConfig]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape' && introPhase === 'complete') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [introPhase, onClose]);

  useEffect(() => {
    return () => {
      introTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      introTimeoutsRef.current = [];

      if (cryAudioRef.current) {
        cryAudioRef.current.pause();
        cryAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    introTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
    introTimeoutsRef.current = [];

    let accumulatedDelay = 0;

    BATTLE_INTRO_SEQUENCE.forEach((step) => {
      accumulatedDelay += step.delay;
      const timeoutId = window.setTimeout(() => {
        setIntroPhase(step.key);
      }, accumulatedDelay);
      introTimeoutsRef.current.push(timeoutId);
    });

    return () => {
      introTimeoutsRef.current.forEach((timeoutId) => window.clearTimeout(timeoutId));
      introTimeoutsRef.current = [];
    };
  }, [battleConfig]);

  useEffect(() => {
    if (!battleState.pendingCryUrl) {
      return undefined;
    }

    playCry(battleState.pendingCryUrl, cryAudioRef);
    return undefined;
  }, [battleState.pendingCryToken, battleState.pendingCryUrl]);

  useEffect(() => {
    const introEnemy = battleState.enemyTeam[battleState.activeEnemyIndex];
    const introPlayer = battleState.playerTeam[battleState.activePlayerIndex];

    if (introPhase === 'enemy-pokemon-materialize' && introEnemy?.cryUrl) {
      playCry(introEnemy.cryUrl, cryAudioRef);
      return;
    }

    if (introPhase === 'player-pokemon-materialize' && introPlayer?.cryUrl) {
      playCry(introPlayer.cryUrl, cryAudioRef);
    }
  }, [battleState.activeEnemyIndex, battleState.activePlayerIndex, battleState.enemyTeam, battleState.playerTeam, introPhase]);

  useEffect(() => {
    if (!battleState.result) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      onComplete(battleState.result);
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [battleState.result, onComplete]);

  if (!battleConfig) {
    return null;
  }

  const playerActive = battleState.playerTeam[battleState.activePlayerIndex];
  const enemyActive = battleState.enemyTeam[battleState.activeEnemyIndex];
  const championSprite = championSprites[battleConfig.champion.key] ?? null;
  const isBusy = battleState.busy || battleState.eventQueue.length > 0;
  const isIntroComplete = introPhase === 'complete';
  const areInteractionsLocked = !isIntroComplete || isBusy;
  const showPlayerParty = battleState.view === 'root' && !battleState.forceSwitch;
  const pendingEnemy = typeof battleState.pendingEnemyIndex === 'number'
    ? battleState.enemyTeam[battleState.pendingEnemyIndex]
    : null;
  const showEnemyTrainer = hasReachedIntroPhase(introPhase, 'enemy-trainer-enter');
  const showEnemyPokeball = introPhase === 'enemy-pokeball-throw';
  const showEnemyPokemon = hasReachedIntroPhase(introPhase, 'enemy-pokemon-materialize');
  const showEnemyStatus = hasReachedIntroPhase(introPhase, 'enemy-status-reveal');
  const showPlayerPokeball = introPhase === 'player-pokeball-throw';
  const showPlayerPokemon = hasReachedIntroPhase(introPhase, 'player-pokemon-materialize');
  const showPlayerStatus = hasReachedIntroPhase(introPhase, 'player-status-reveal');
  const enemyTrainerClassName = [
    'battle-trainer',
    'battle-trainer-enemy',
    'pixel-art',
    introPhase === 'enemy-trainer-enter' ? 'enemy-trainer-enter' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const enemySpriteClassName = [
    'battle-sprite',
    'battle-sprite-enemy',
    'pixel-art',
    battleState.activeActor === 'enemy' && isIntroComplete ? 'is-attacking' : '',
    introPhase === 'enemy-pokemon-materialize' ? 'enemy-pokemon-materialize' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const playerSpriteClassName = [
    'battle-sprite',
    'battle-sprite-player',
    'pixel-art',
    battleState.activeActor === 'player' && isIntroComplete ? 'is-attacking' : '',
    introPhase === 'player-pokemon-materialize' ? 'player-pokemon-materialize' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="battle-layer" role="presentation">
      <div className="battle-popup" role="dialog" aria-modal="true" aria-label={`Batalha contra ${battleConfig.champion.label}`}>
        <button
          type="button"
          className="battle-close"
          onClick={() => handleUiButtonClick(onClose)}
          aria-label="Sair da batalha"
          disabled={!isIntroComplete}
        >
          x
        </button>

        <div className="battle-stage">
          <div className="battle-enemy-hud">
            <div key={enemyActive.battleId} className={showEnemyStatus ? 'battle-status battle-status-enemy status-reveal' : 'battle-status battle-status-enemy is-empty'}>
              {showEnemyStatus ? (
                <>
                  <div className="battle-status-head">
                    <strong>{enemyActive.displayName}</strong>
                    <span>Lv. {enemyActive.level}</span>
                  </div>
                  <BattleHealthBar currentHp={enemyActive.displayHp} maxHp={enemyActive.maxHp} />
                  <small>{battleConfig.champion.label}</small>
                </>
              ) : (
                <BattleStatusEmpty />
              )}
            </div>
            <BattlePartyDots team={battleState.enemyTeam} align="left" />
          </div>

          <div className="battle-arena battle-arena-enemy" aria-hidden="true">
            <span className="battle-platform battle-platform-enemy" />
            {championSprite && showEnemyTrainer ? <img src={championSprite} alt="" className={enemyTrainerClassName} /> : null}
            {showEnemyPokeball ? <BattleThrowPokeball side="enemy" /> : null}
            {showEnemyPokemon ? (
              <img
                src={enemyActive.spriteFront}
                alt={enemyActive.displayName}
                className={enemySpriteClassName}
              />
            ) : null}
          </div>

          <div className="battle-arena battle-arena-player" aria-hidden="true">
            <span className="battle-platform battle-platform-player" />
            {showPlayerPokeball ? <BattleThrowPokeball side="player" /> : null}
            {showPlayerPokemon ? (
              <img
                src={playerActive.spriteBack}
                alt={playerActive.displayName}
                className={playerSpriteClassName}
              />
            ) : null}
          </div>
        </div>

        <div className="battle-bottom">
          <div className="battle-bottom-column battle-bottom-left">
            <div className="battle-textbox">
              <span>{battleState.message}</span>
              <div className="battle-textbox-actions">
                {battleState.view !== 'root' && !battleState.forceSwitch ? (
                  <button
                    type="button"
                    className="battle-textbox-back"
                    onClick={() =>
                      handleUiButtonClick(() =>
                        setBattleState((current) => ({ ...current, view: 'root', message: `O que ${playerActive.displayName} vai fazer?` })),
                      )
                    }
                    disabled={areInteractionsLocked}
                  >
                    Voltar
                  </button>
                ) : null}
                {battleState.eventQueue.length ? (
                  <button
                    type="button"
                    className="battle-textbox-next"
                    onClick={() =>
                      handleUiButtonClick(() =>
                        setBattleState((current) => advanceBattleSequence(current)),
                      )
                    }
                    disabled={!isIntroComplete}
                  >
                    A
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <div className="battle-bottom-column battle-bottom-right">
          <div className="battle-side-ui">
            <div key={playerActive.battleId} className={showPlayerStatus ? 'battle-status battle-status-player status-reveal' : 'battle-status battle-status-player is-empty'}>
              {showPlayerStatus ? (
                <>
                  <div className="battle-status-head">
                    <strong>{playerActive.displayName}</strong>
                    <span>Lv. {playerActive.level}</span>
                  </div>
                  <BattleHealthBar currentHp={playerActive.displayHp} maxHp={playerActive.maxHp} />
                  <small>{playerActive.displayHp}/{playerActive.maxHp} HP</small>
                </>
              ) : (
                <BattleStatusEmpty />
              )}
            </div>

            <div className="battle-controls">
              {battleState.view === 'root' ? (
                <div className="battle-root-controls">
                  <div className="battle-root-actions">
                    <button
                      type="button"
                      className="battle-action battle-action-fight"
                      onClick={() =>
                        handleUiButtonClick(() =>
                          setBattleState((current) => ({ ...current, view: 'fight', message: `Escolha um ataque para ${playerActive.displayName}.` })),
                        )
                      }
                      disabled={battleState.forceSwitch || Boolean(battleState.result) || areInteractionsLocked}
                    >
                      Atacar
                    </button>
                    <button
                      type="button"
                      className="battle-action battle-action-team"
                      onClick={() =>
                        handleUiButtonClick(() =>
                          setBattleState((current) => ({ ...current, view: 'switch', message: 'Escolha quem vai entrar.' })),
                        )
                      }
                      disabled={Boolean(battleState.result) || areInteractionsLocked}
                    >
                      Trocar
                    </button>
                  </div>
                  {showPlayerParty ? <BattlePartyDots team={battleState.playerTeam} align="right" compact /> : null}
                </div>
              ) : null}

              {battleState.view === 'enemy-switch-prompt' && pendingEnemy ? (
                <>
                  <button
                    type="button"
                    className="battle-action battle-action-fight"
                    onClick={() =>
                      handleUiButtonClick(() =>
                        setBattleState((current) => ({
                          ...current,
                          view: 'enemy-switch-select',
                          message: 'Escolha quem vai entrar.',
                        })),
                      )
                    }
                    disabled={Boolean(battleState.result) || areInteractionsLocked}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    className="battle-action battle-action-team"
                    onClick={() =>
                      handleUiButtonClick(() =>
                        setBattleState((current) => queueEnemySendOut(current)),
                      )
                    }
                    disabled={Boolean(battleState.result) || areInteractionsLocked}
                  >
                    Nao
                  </button>
                </>
              ) : null}

              {battleState.view === 'fight' ? (
                <>
                  {playerActive.moves.map((move, index) => (
                    <button
                      key={move.id}
                      type="button"
                      className="battle-action battle-move"
                      style={{ '--move-color': TYPE_COLORS[move.type] ?? '#74828f' }}
                      onClick={() =>
                        handleUiButtonClick(() =>
                          setBattleState((current) => queueAttackTurn(current, index, battleConfig.champion.label)),
                        )
                      }
                      disabled={Boolean(battleState.result) || areInteractionsLocked}
                    >
                      <span>{move.displayName}</span>
                      <small>{capitalize(move.type)}</small>
                    </button>
                  ))}
                </>
              ) : null}

              {battleState.view === 'switch' || battleState.view === 'enemy-switch-select' ? (
                <>
                  {battleState.playerTeam.map((member, index) => {
                    const isActive = index === battleState.activePlayerIndex;
                    const isFainted = member.currentHp <= 0;

                    return (
                      <button
                        key={member.battleId}
                        type="button"
                        className="battle-action battle-switch"
                        onClick={() =>
                          handleUiButtonClick(() =>
                            setBattleState((current) =>
                              current.view === 'enemy-switch-select'
                                ? queueEnemyPromptSwitchTurn(current, index, battleConfig.champion.label)
                                : queueSwitchTurn(current, index),
                            ),
                          )
                        }
                        disabled={isActive || isFainted || Boolean(battleState.result) || areInteractionsLocked}
                      >
                        <span>{member.displayName}</span>
                        <small>{isFainted ? 'Sem HP' : `${member.displayHp}/${member.maxHp}`}</small>
                      </button>
                    );
                  })}
                </>
              ) : null}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BattleHealthBar({ currentHp, maxHp }) {
  const ratio = maxHp > 0 ? currentHp / maxHp : 0;
  const tone = ratio > 0.5 ? '#5dde4f' : ratio > 0.2 ? '#f0ca34' : '#d34141';

  return (
    <div className="battle-hp">
      <span>HP</span>
      <div className="battle-hp-track">
        <div className="battle-hp-fill" style={{ width: `${Math.max(0, ratio) * 100}%`, '--hp-color': tone }} />
      </div>
    </div>
  );
}

function BattleStatusEmpty() {
  return (
    <div className="battle-status-empty" aria-hidden="true">
      <span className="battle-status-empty-line battle-status-empty-line-title" />
      <span className="battle-status-empty-line battle-status-empty-line-level" />
      <span className="battle-status-empty-line battle-status-empty-line-hp" />
      <span className="battle-status-empty-line battle-status-empty-line-meta" />
    </div>
  );
}

function BattleThrowPokeball({ side }) {
  return (
    <div className={side === 'enemy' ? 'battle-throw battle-throw-enemy' : 'battle-throw battle-throw-player'}>
      <img src={pokeballClose} alt="" className="battle-throw-frame battle-throw-frame-close pixel-art" />
      <img src={pokeballSemiOpen} alt="" className="battle-throw-frame battle-throw-frame-semi pixel-art" />
      <img src={pokeballOpen} alt="" className="battle-throw-frame battle-throw-frame-open pixel-art" />
    </div>
  );
}

function hasReachedIntroPhase(currentPhase, targetPhase) {
  const currentIndex = BATTLE_INTRO_SEQUENCE.findIndex((step) => step.key === currentPhase);
  const targetIndex = BATTLE_INTRO_SEQUENCE.findIndex((step) => step.key === targetPhase);

  if (currentPhase === 'initial') {
    return false;
  }

  if (currentPhase === 'complete') {
    return true;
  }

  return currentIndex >= targetIndex;
}

function BattlePartyDots({ team, align = 'left', compact = false }) {
  const slots = Array.from({ length: 6 }, (_, index) => team[index] ?? null);

  return (
    <div className={`battle-party battle-party-${align}${compact ? ' battle-party-compact' : ''}`} aria-hidden="true">
      {slots.map((member, index) => {
        const isAvailable = Boolean(member) && member.currentHp > 0;
        return (
          <span
            key={`${align}-${index}`}
            className={isAvailable ? 'battle-party-slot is-active' : 'battle-party-slot is-fainted'}
          >
            <img src={pokeballClose} alt="" className="battle-party-icon pixel-art" />
          </span>
        );
      })}
    </div>
  );
}

function createInitialBattleState(config) {
  if (!config) {
    return {
      playerTeam: [],
      enemyTeam: [],
      activePlayerIndex: 0,
      activeEnemyIndex: 0,
      view: 'root',
      forceSwitch: false,
      message: '',
      result: null,
      busy: false,
      activeActor: null,
      eventQueue: [],
      pendingCryUrl: null,
      pendingCryToken: 0,
      pendingEnemyIndex: null,
      championLabel: '',
    };
  }

  return {
    playerTeam: config.playerTeam.map((member) => cloneMember(member)),
    enemyTeam: config.opponentTeam.map((member) => cloneMember(member)),
    activePlayerIndex: 0,
    activeEnemyIndex: 0,
    view: 'root',
    forceSwitch: false,
    message: `${config.champion.label} desafiou voce para uma batalha!`,
    result: null,
    busy: false,
    activeActor: null,
    eventQueue: [],
    pendingCryUrl: null,
    pendingCryToken: 0,
    pendingEnemyIndex: null,
    championLabel: config.champion.label,
  };
}

function queueAttackTurn(state, moveIndex, championLabel) {
  if (state.result || state.busy || state.eventQueue.length) {
    return state;
  }

  const initial = cloneBattleState(state);
  const player = initial.playerTeam[initial.activePlayerIndex];
  const enemy = initial.enemyTeam[initial.activeEnemyIndex];
  const playerMove = player.moves[moveIndex];
  const enemyMove = chooseEnemyMove(enemy, player);
  const turnOrder = [
    { side: 'player', move: playerMove, priority: playerMove.priority ?? 0, speed: player.stats.speed },
    { side: 'enemy', move: enemyMove, priority: enemyMove.priority ?? 0, speed: enemy.stats.speed },
  ].sort((left, right) => {
    if (right.priority !== left.priority) {
      return right.priority - left.priority;
    }

    if (right.speed !== left.speed) {
      return right.speed - left.speed;
    }

    return left.side === 'player' ? -1 : 1;
  });

  const eventQueue = [];
  let nextState = cloneBattleState(initial);

  turnOrder.forEach((action) => {
    if (nextState.result) {
      return;
    }

    const attacker = action.side === 'player'
      ? nextState.playerTeam[nextState.activePlayerIndex]
      : nextState.enemyTeam[nextState.activeEnemyIndex];
    const defender = action.side === 'player'
      ? nextState.enemyTeam[nextState.activeEnemyIndex]
      : nextState.playerTeam[nextState.activePlayerIndex];

    if (!attacker || !defender || attacker.currentHp <= 0 || defender.currentHp <= 0) {
      return;
    }

    const attackEvent = {
      actor: action.side,
      message: `${attacker.displayName} usou ${action.move.displayName}!`,
      cryUrl: attacker.cryUrl,
      delay: ATTACK_ANNOUNCE_DELAY_MS,
    };

    const outcome = applyMoveDamage(attacker, defender, action.move);
    const afterAttack = cloneBattleState(nextState);
    const defenderAfterAttack = action.side === 'player'
      ? afterAttack.enemyTeam[afterAttack.activeEnemyIndex]
      : afterAttack.playerTeam[afterAttack.activePlayerIndex];

    const followUpMessage = getOutcomeMessage(outcome);

    eventQueue.push({
      actor: action.side,
      message: attackEvent.message,
      cryUrl: attackEvent.cryUrl,
      delay: attackEvent.delay,
      state: cloneBattleState(nextState),
    });

    if (followUpMessage) {
      eventQueue.push({
        actor: null,
        message: followUpMessage,
        delay: EFFECT_MESSAGE_DELAY_MS,
        state: cloneBattleState(nextState),
      });
    }

    if (!outcome.missed && !outcome.immune && defenderAfterAttack) {
      defenderAfterAttack.displayHp = defenderAfterAttack.currentHp;
      eventQueue.push({
        actor: null,
        message: followUpMessage ?? attackEvent.message,
        delay: HP_DROP_DELAY_MS,
        state: afterAttack,
      });
    }

    nextState = afterAttack;

    if (!outcome.missed && !outcome.immune && defenderAfterAttack?.currentHp <= 0) {
      const faintState = cloneBattleState(nextState);
      let faintMessage = `${defender.displayName} foi nocauteado!`;

      if (action.side === 'player') {
        const nextEnemyIndex = findNextAvailableIndex(faintState.enemyTeam);

        if (nextEnemyIndex === null) {
          faintState.result = 'win';
          faintMessage = `${defender.displayName} foi nocauteado! ${championLabel} foi derrotado!`;
        } else {
          faintState.pendingEnemyIndex = nextEnemyIndex;
          faintState.view = 'enemy-switch-prompt';
          faintMessage = `${defender.displayName} foi nocauteado!`;
        }
      } else {
        const nextPlayerIndex = findNextAvailableIndex(faintState.playerTeam);

        if (nextPlayerIndex === null) {
          faintState.result = 'lose';
          faintMessage = `${defender.displayName} foi nocauteado! Seu time inteiro caiu.`;
        } else {
          faintState.forceSwitch = true;
          faintState.view = 'switch';
          faintMessage = `${defender.displayName} foi nocauteado! Escolha outro Pokemon para continuar.`;
        }
      }

      eventQueue.push({
        actor: null,
        message: faintMessage,
        delay: FAINT_MESSAGE_DELAY_MS,
        state: faintState,
      });

      nextState = faintState;
    }
  });

  const finalState = cloneBattleState(nextState);

  if (!finalState.result && !finalState.forceSwitch && finalState.view === 'root') {
    finalState.view = 'root';
    finalState.message = `O que ${finalState.playerTeam[finalState.activePlayerIndex].displayName} vai fazer?`;
  }

  finalState.busy = true;
  finalState.activeActor = null;
  finalState.eventQueue = eventQueue.map((event, index) => ({
    ...event,
    isLast: index === eventQueue.length - 1,
    finalView: finalState.view,
    finalForceSwitch: finalState.forceSwitch,
    finalResult: finalState.result,
  }));

  return beginBattleSequence(finalState);
}

function queueSwitchTurn(state, targetIndex) {
  if (state.result || state.busy || state.eventQueue.length) {
    return state;
  }

  const next = cloneBattleState(state);
  const previousPlayer = next.playerTeam[next.activePlayerIndex];
  const nextPlayer = next.playerTeam[targetIndex];

  if (!nextPlayer || nextPlayer.currentHp <= 0 || targetIndex === next.activePlayerIndex) {
    return state;
  }

  next.activePlayerIndex = targetIndex;
  next.forceSwitch = false;
  next.view = 'root';

  const queue = [
    {
      actor: 'player',
      message: `${previousPlayer.displayName}, volte! ${nextPlayer.displayName}, vai!`,
      cryUrl: nextPlayer.cryUrl,
      delay: ATTACK_ANNOUNCE_DELAY_MS,
      state: cloneBattleState(next),
    },
  ];

  const enemy = next.enemyTeam[next.activeEnemyIndex];

  if (enemy && !state.forceSwitch && enemy.currentHp > 0) {
    const enemyMove = chooseEnemyMove(enemy, nextPlayer);
    const attackState = cloneBattleState(next);
    queue.push({
      actor: 'enemy',
      message: `${enemy.displayName} usou ${enemyMove.displayName}!`,
      cryUrl: enemy.cryUrl,
      delay: ATTACK_ANNOUNCE_DELAY_MS,
      state: attackState,
    });

    const outcome = applyMoveDamage(enemy, next.playerTeam[next.activePlayerIndex], enemyMove);
    const afterAttack = cloneBattleState(next);
    const activePlayerAfterAttack = afterAttack.playerTeam[afterAttack.activePlayerIndex];
    const followUpMessage = getOutcomeMessage(outcome);

    if (followUpMessage) {
      queue.push({
        actor: null,
        message: followUpMessage,
        delay: EFFECT_MESSAGE_DELAY_MS,
        state: cloneBattleState(next),
      });
    }

    if (!outcome.missed && !outcome.immune) {
      activePlayerAfterAttack.displayHp = activePlayerAfterAttack.currentHp;
      queue.push({
        actor: null,
        message: followUpMessage ?? `${enemy.displayName} usou ${enemyMove.displayName}!`,
        delay: HP_DROP_DELAY_MS,
        state: afterAttack,
      });
    }

    next.playerTeam = afterAttack.playerTeam;

    if (!outcome.missed && !outcome.immune && afterAttack.playerTeam[afterAttack.activePlayerIndex].currentHp <= 0) {
      const faintState = cloneBattleState(afterAttack);
      const nextPlayerIndex = findNextAvailableIndex(faintState.playerTeam);

      if (nextPlayerIndex === null) {
        faintState.result = 'lose';
        queue.push({
          actor: null,
          message: `${faintState.playerTeam[faintState.activePlayerIndex].displayName} caiu! Seu time inteiro caiu.`,
          delay: FAINT_MESSAGE_DELAY_MS,
          state: faintState,
        });
        next.result = 'lose';
      } else {
        faintState.forceSwitch = true;
        faintState.view = 'switch';
        queue.push({
          actor: null,
          message: `${faintState.playerTeam[faintState.activePlayerIndex].displayName} caiu! Escolha outro Pokemon para continuar.`,
          delay: FAINT_MESSAGE_DELAY_MS,
          state: faintState,
        });
        next.forceSwitch = true;
        next.view = 'switch';
      }
    }
  }

  next.busy = true;
  next.eventQueue = queue.map((event, index) => ({
    ...event,
    isLast: index === queue.length - 1,
    finalView: next.view,
    finalForceSwitch: next.forceSwitch,
    finalResult: next.result,
  }));

  return beginBattleSequence(next);
}

function queueEnemyPromptSwitchTurn(state, targetIndex, championLabel) {
  if (state.result || state.busy || state.eventQueue.length || typeof state.pendingEnemyIndex !== 'number') {
    return state;
  }

  const next = cloneBattleState(state);
  const previousPlayer = next.playerTeam[next.activePlayerIndex];
  const nextPlayer = next.playerTeam[targetIndex];
  const pendingEnemy = next.enemyTeam[next.pendingEnemyIndex];

  if (!nextPlayer || !pendingEnemy || nextPlayer.currentHp <= 0 || targetIndex === next.activePlayerIndex) {
    return state;
  }

  next.activeEnemyIndex = next.pendingEnemyIndex;
  next.pendingEnemyIndex = null;
  next.activePlayerIndex = targetIndex;
  next.view = 'root';
  next.forceSwitch = false;

  const queue = [
    {
      actor: 'enemy',
      message: `${championLabel} vai usar ${pendingEnemy.displayName}.`,
      delay: EFFECT_MESSAGE_DELAY_MS,
      state: cloneBattleState(state),
    },
    {
      actor: 'enemy',
      message: `Vai ${pendingEnemy.displayName}!`,
      cryUrl: pendingEnemy.cryUrl,
      delay: ATTACK_ANNOUNCE_DELAY_MS,
      state: cloneBattleState(next),
    },
    {
      actor: 'player',
      message: `${previousPlayer.displayName}, volte! Vai ${nextPlayer.displayName}!`,
      cryUrl: nextPlayer.cryUrl,
      delay: ATTACK_ANNOUNCE_DELAY_MS,
      state: cloneBattleState(next),
    },
  ];

  next.busy = true;
  next.eventQueue = queue.map((event, index) => ({
    ...event,
    isLast: index === queue.length - 1,
    finalView: next.view,
    finalForceSwitch: next.forceSwitch,
    finalResult: next.result,
  }));

  return beginBattleSequence(next);
}

function queueEnemySendOut(state) {
  if (state.result || state.busy || state.eventQueue.length || typeof state.pendingEnemyIndex !== 'number') {
    return state;
  }

  const next = cloneBattleState(state);
  const pendingEnemy = next.enemyTeam[next.pendingEnemyIndex];

  if (!pendingEnemy) {
    return state;
  }

  next.activeEnemyIndex = next.pendingEnemyIndex;
  next.pendingEnemyIndex = null;
  next.view = 'root';

  const queue = [
    {
      actor: 'enemy',
      message: `Vai ${pendingEnemy.displayName}!`,
      cryUrl: pendingEnemy.cryUrl,
      delay: ATTACK_ANNOUNCE_DELAY_MS,
      state: cloneBattleState(next),
    },
  ];

  next.busy = true;
  next.eventQueue = queue.map((event, index) => ({
    ...event,
    isLast: index === queue.length - 1,
    finalView: next.view,
    finalForceSwitch: next.forceSwitch,
    finalResult: next.result,
  }));

  return beginBattleSequence(next);
}

function applyBattleEvent(state) {
  if (!state.eventQueue.length) {
    return state;
  }

  const [event, ...rest] = state.eventQueue;
  const next = cloneBattleState(event.state ?? state);

  next.message = event.message ?? next.message;
  next.activeActor = event.actor ?? null;
  next.eventQueue = rest;
  next.busy = rest.length > 0;
  next.pendingCryUrl = event.cryUrl ?? null;
  next.pendingCryToken = event.cryUrl ? (state.pendingCryToken ?? 0) + 1 : (state.pendingCryToken ?? 0);

  if (event.isLast) {
    next.view = event.finalView ?? next.view;
    next.forceSwitch = event.finalForceSwitch ?? next.forceSwitch;
    next.result = event.finalResult ?? next.result;
    next.busy = false;
    next.activeActor = null;

    if (!next.result && !next.forceSwitch && next.view === 'root') {
      next.message = `O que ${next.playerTeam[next.activePlayerIndex].displayName} vai fazer?`;
    } else if (!next.result && next.view === 'enemy-switch-prompt' && typeof next.pendingEnemyIndex === 'number') {
      next.message = `${next.championLabel ?? ''}`.trim()
        ? `${next.championLabel} vai usar ${next.enemyTeam[next.pendingEnemyIndex].displayName}. Deseja trocar de Pokemon?`
        : `O adversario vai usar ${next.enemyTeam[next.pendingEnemyIndex].displayName}. Deseja trocar de Pokemon?`;
    }
  }

  return next;
}

function beginBattleSequence(state) {
  if (!state.eventQueue.length) {
    return state;
  }

  return applyBattleEvent(state);
}

function advanceBattleSequence(state) {
  if (!state.eventQueue.length) {
    return state;
  }

  return applyBattleEvent(state);
}

function getOutcomeMessage(outcome) {
  if (outcome.missed) {
    return 'Mas o ataque errou.';
  }

  if (outcome.immune) {
    return 'Nao teve efeito.';
  }

  if (outcome.multiplier >= 2) {
    return 'Foi super efetivo!';
  }

  if (outcome.multiplier > 0 && outcome.multiplier < 1) {
    return 'Nao foi muito efetivo.';
  }

  return null;
}

function applyMoveDamage(attacker, defender, move) {
  if ((move.accuracy ?? 100) < 100 && Math.random() * 100 > (move.accuracy ?? 100)) {
    return { missed: true, immune: false, multiplier: 1 };
  }

  if (move.damageClass === 'status' || !move.power) {
    return { missed: false, immune: false, multiplier: 1 };
  }

  const multiplier = getTypeMultiplier(move.type, defender.types);

  if (multiplier === 0) {
    return { missed: false, immune: true, multiplier };
  }

  const isPhysical = move.damageClass === 'physical';
  const attackStat = isPhysical ? attacker.stats.attack : attacker.stats.specialAttack;
  const defenseStat = isPhysical ? defender.stats.defense : defender.stats.specialDefense;
  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const randomFactor = 0.86 + Math.random() * 0.14;
  const baseDamage = (((22 * move.power * (attackStat / Math.max(1, defenseStat))) / 50) + 2) * stab * multiplier * randomFactor;
  const damage = Math.max(1, Math.floor(baseDamage));

  defender.currentHp = Math.max(0, defender.currentHp - damage);
  return { missed: false, immune: false, multiplier };
}

function chooseEnemyMove(enemy, defender) {
  return enemy.moves
    .map((move) => ({
      move,
      score: estimateMoveDamage(enemy, defender, move),
    }))
    .sort((left, right) => right.score - left.score)[0]?.move ?? enemy.moves[0];
}

function estimateMoveDamage(attacker, defender, move) {
  if (!move) {
    return 0;
  }

  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const multiplier = getTypeMultiplier(move.type, defender.types);
  const power = move.damageClass === 'status' ? 0 : move.power ?? 0;
  return power * stab * multiplier * ((move.accuracy ?? 100) / 100);
}

function findNextAvailableIndex(team) {
  const index = team.findIndex((member) => member.currentHp > 0);
  return index >= 0 ? index : null;
}

function cloneBattleState(state) {
  return {
    ...state,
    playerTeam: state.playerTeam.map((member) => cloneMember(member)),
    enemyTeam: state.enemyTeam.map((member) => cloneMember(member)),
    eventQueue: state.eventQueue ? [...state.eventQueue] : [],
    pendingCryUrl: state.pendingCryUrl ?? null,
    pendingCryToken: state.pendingCryToken ?? 0,
  };
}

function cloneMember(member) {
  return {
    ...member,
    displayHp: typeof member.displayHp === 'number' ? member.displayHp : member.currentHp,
    moves: member.moves.map((move) => ({ ...move })),
  };
}

function playCry(url, cryAudioRef) {
  if (!url || typeof Audio === 'undefined') {
    return;
  }

  if (cryAudioRef.current) {
    cryAudioRef.current.pause();
  }

  const audio = new Audio(url);
  audio.volume = 0.42;
  audio.play().catch(() => {});
  cryAudioRef.current = audio;
}
