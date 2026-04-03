import { useEffect, useMemo, useRef, useState } from 'react';
import bagCloseSprite from './assets/bagClose.png';
import bagLeftOpenSprite from './assets/BagLeftopen.png';
import bagRightOpenSprite from './assets/BagRightopen.png';
import bagUpOpenSprite from './assets/BagUpopen.png';
import buttonSfx from './SFX/ButtonSFX.ogg';
import menu1Sfx from './SFX/Menu1SFX.ogg';
import menu2Sfx from './SFX/Menu2SFX.ogg';
import menu3Sfx from './SFX/Menu3SFX.ogg';
import mapCloseSprite from './assets/MapClose.png';
import mapOpenLeftSprite from './assets/MapOpenleft.png';
import mapOpenRightSprite from './assets/MapOpenright.png';
import pokeballCloseSprite from './assets/PokeballClose.png';
import pokeballSemiOpenSprite from './assets/PokeballSemiOpen.png';
import TeamBuilderPopup from './TeamBuilderPopup';

const API_BASE = 'https://pokeapi.co/api/v2';
const pokemonDetailRequestCache = new Map();
const generationMetaCache = { data: null, promise: null };
const BAG_ITEM_FETCH_LIMIT = 36;
const pokeballCache = { status: 'idle', data: [], error: '', promise: null };
const bagPocketCache = new Map();
const INITIAL_BAG_MENU_STATE = {
  status: 'idle',
  data: [],
  error: '',
  selectedId: null,
};
const MENU_TRACKS = [menu1Sfx, menu2Sfx, menu3Sfx];
const audioSettings = {
  muted: false,
  volume: 0.6,
};
const INITIAL_TEAMS = [{ id: 'team-1', name: 'Time 1', members: [] }];

const GENERATIONS = [
  { id: 1, label: 'Kanto', accent: '#ff6b6b' },
  { id: 2, label: 'Johto', accent: '#f59f00' },
  { id: 3, label: 'Hoenn', accent: '#2f9e44' },
  { id: 4, label: 'Sinnoh', accent: '#1971c2' },
  { id: 5, label: 'Unova', accent: '#495057' },
  { id: 6, label: 'Kalos', accent: '#d6336c' },
  { id: 7, label: 'Alola', accent: '#f08c00' },
  { id: 8, label: 'Galar', accent: '#5f3dc4' },
  { id: 9, label: 'Paldea', accent: '#0b7285' },
];

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

const BAG_MENUS = [
  { id: 'items', label: 'Items', sprite: bagLeftOpenSprite },
  { id: 'key-items', label: 'Key Items', sprite: bagUpOpenSprite },
  { id: 'pokeballs', label: 'Pokebolas', sprite: bagRightOpenSprite },
];

const BAG_MENU_LOADERS = {
  items: () => fetchPocketItems('misc', BAG_ITEM_FETCH_LIMIT),
  'key-items': () => fetchPocketItems('key', BAG_ITEM_FETCH_LIMIT),
  pokeballs: () => fetchPokeballItems(),
};

const POKEBALL_ITEM_NAMES = [
  'master-ball',
  'ultra-ball',
  'great-ball',
  'poke-ball',
  'safari-ball',
  'net-ball',
  'dive-ball',
  'nest-ball',
  'repeat-ball',
  'timer-ball',
  'luxury-ball',
  'premier-ball',
  'dusk-ball',
  'heal-ball',
  'quick-ball',
  'cherish-ball',
  'fast-ball',
  'level-ball',
  'lure-ball',
  'heavy-ball',
  'love-ball',
  'friend-ball',
  'moon-ball',
  'sport-ball',
  'park-ball',
  'dream-ball',
  'beast-ball',
];

function App() {
  const [generationMeta, setGenerationMeta] = useState([]);
  const [selectedGeneration, setSelectedGeneration] = useState(1);
  const [pokemonDetailCache, setPokemonDetailCache] = useState({});
  const [selectedPokemonId, setSelectedPokemonId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [activeBagMenu, setActiveBagMenu] = useState('key-items');
  const [bagShake, setBagShake] = useState({ tick: 0, direction: 'right' });
  const [detailLightActive, setDetailLightActive] = useState(false);
  const [mapPopupPhase, setMapPopupPhase] = useState('closed');
  const [isTeamBuilderOpen, setIsTeamBuilderOpen] = useState(false);
  const [teams, setTeams] = useState(INITIAL_TEAMS);
  const [selectedTeamId, setSelectedTeamId] = useState(INITIAL_TEAMS[0].id);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [siteVolume, setSiteVolume] = useState(60);
  const [menuTrackIndex, setMenuTrackIndex] = useState(() => Math.floor(Math.random() * MENU_TRACKS.length));
  const [bagData, setBagData] = useState(() => ({
    items: { ...INITIAL_BAG_MENU_STATE },
    'key-items': { ...INITIAL_BAG_MENU_STATE },
    pokeballs: { ...INITIAL_BAG_MENU_STATE },
  }));
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState('');
  const bagDataRef = useRef(bagData);
  const detailLightTimeoutRef = useRef(null);
  const ambientAudioRef = useRef(null);

  useEffect(() => {
    bagDataRef.current = bagData;
  }, [bagData]);

  useEffect(() => {
    return () => {
      if (detailLightTimeoutRef.current) {
        window.clearTimeout(detailLightTimeoutRef.current);
      }

      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    audioSettings.muted = isMuted;
    audioSettings.volume = siteVolume / 100;
  }, [isMuted, siteVolume]);

  useEffect(() => {
    if (typeof Audio === 'undefined') {
      return undefined;
    }

    const ambientAudio = new Audio(MENU_TRACKS[menuTrackIndex]);
    ambientAudioRef.current = ambientAudio;
    ambientAudio.loop = false;
    ambientAudio.preload = 'auto';
    ambientAudio.volume = getAmbientVolume();

    function playAmbient() {
      ambientAudio.volume = getAmbientVolume();
      ambientAudio.play().catch(() => {});
    }

    function handleEnded() {
      setMenuTrackIndex((current) => (current + 1) % MENU_TRACKS.length);
    }

    ambientAudio.addEventListener('ended', handleEnded);
    playAmbient();

    window.addEventListener('pointerdown', playAmbient);
    window.addEventListener('keydown', playAmbient);

    return () => {
      ambientAudio.pause();
      ambientAudio.removeEventListener('ended', handleEnded);
      window.removeEventListener('pointerdown', playAmbient);
      window.removeEventListener('keydown', playAmbient);

      if (ambientAudioRef.current === ambientAudio) {
        ambientAudioRef.current = null;
      }
    };
  }, [menuTrackIndex]);

  useEffect(() => {
    if (!ambientAudioRef.current) {
      return;
    }

    ambientAudioRef.current.volume = getAmbientVolume();
  }, [isMuted, siteVolume]);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      try {
        setLoadingMeta(true);
        const meta = await fetchGenerationMetaCached();

        if (!active) {
          return;
        }

        setGenerationMeta(meta);
      } catch (error) {
        if (active) {
          setMetaError('Nao foi possivel carregar os dados da PokeAPI.');
        }
      } finally {
        if (active) {
          setLoadingMeta(false);
        }
      }
    }

    loadInitialData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isBagOpen) {
      return;
    }

    const currentBagMenuLabel =
      BAG_MENUS.find((menu) => menu.id === activeBagMenu)?.label ?? 'itens';
    const currentBagMenuState = bagDataRef.current[activeBagMenu];

    if (!currentBagMenuState || currentBagMenuState.status !== 'idle') {
      return;
    }

    let active = true;

    setBagData((current) => ({
      ...current,
      [activeBagMenu]: {
        ...current[activeBagMenu],
        status: 'loading',
        error: '',
      },
    }));

    BAG_MENU_LOADERS[activeBagMenu]()
      .then((items) => {
        if (!active) {
          return;
        }

        setBagData((current) => ({
          ...current,
          [activeBagMenu]: {
            status: 'success',
            data: items,
            error: '',
            selectedId: current[activeBagMenu].selectedId ?? items[0]?.id ?? null,
          },
        }));
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setBagData((current) => ({
          ...current,
          [activeBagMenu]: {
            ...current[activeBagMenu],
            status: 'error',
            data: [],
            error: `Nao foi possivel carregar ${currentBagMenuLabel} agora.`,
          },
        }));
      });

    return () => {
      active = false;
    };
  }, [activeBagMenu, isBagOpen]);

  const currentGeneration = useMemo(
    () => generationMeta.find((item) => item.id === selectedGeneration),
    [generationMeta, selectedGeneration],
  );

  const currentGenerationEntries = currentGeneration?.pokemonEntries ?? [];

  const allPokemonEntries = useMemo(
    () => generationMeta.flatMap((generation) => generation.pokemonEntries ?? []),
    [generationMeta],
  );

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPokemon = useMemo(() => {
    if (!normalizedSearch) {
      return currentGenerationEntries;
    }

    return allPokemonEntries.filter((pokemon) => {
      const searchId = formatId(pokemon.id);
      return (
        pokemon.displayName.toLowerCase().includes(normalizedSearch) ||
        pokemon.name.includes(normalizedSearch) ||
        searchId.includes(normalizedSearch) ||
        String(pokemon.id).includes(normalizedSearch)
      );
    });
  }, [allPokemonEntries, currentGenerationEntries, normalizedSearch]);

  const selectedPokemon =
    filteredPokemon.find((pokemon) => pokemon.id === selectedPokemonId) ??
    allPokemonEntries.find((pokemon) => pokemon.id === selectedPokemonId) ??
    null;
  const selectedPokemonDetailState = selectedPokemon ? pokemonDetailCache[selectedPokemon.id] : null;
  const activeBagMenuIndex = BAG_MENUS.findIndex((menu) => menu.id === activeBagMenu);
  const activeBagMenuData = BAG_MENUS[activeBagMenuIndex] ?? BAG_MENUS[1];
  const activeBagDataState = bagData[activeBagMenu];
  const activeBagSelectedItem =
    activeBagDataState.data.find((item) => item.id === activeBagDataState.selectedId) ??
    activeBagDataState.data[0] ??
    null;
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0] ?? null;

  useEffect(() => {
    if (!filteredPokemon.length) {
      setSelectedPokemonId(null);
      return;
    }

    if (!filteredPokemon.some((pokemon) => pokemon.id === selectedPokemonId)) {
      setSelectedPokemonId(filteredPokemon[0].id);
    }
  }, [filteredPokemon, selectedPokemonId]);

  useEffect(() => {
    if (!selectedPokemon || selectedPokemonDetailState?.status) {
      return;
    }

    primePokemonDetails(selectedPokemon.id, setPokemonDetailCache);
  }, [selectedPokemon, selectedPokemonDetailState?.status]);

  useEffect(() => {
    if (selectedPokemonDetailState?.status !== 'success') {
      return;
    }

    playPokemonCry(selectedPokemonDetailState.data.cryUrl);
  }, [selectedPokemonDetailState]);

  useEffect(() => {
    setIsQuickAddOpen(false);
  }, [selectedPokemonId]);

  function handleSelectPokemon(id) {
    playButtonSfx();
    triggerDetailLight();
    setSelectedPokemonId(id);

    const cachedDetail = pokemonDetailCache[id];
    if (cachedDetail?.status === 'success') {
      playPokemonCry(cachedDetail.data.cryUrl);
    }
  }

  function handleBagNavigate(direction) {
    playButtonSfx();
    setBagShake((current) => ({
      tick: current.tick + 1,
      direction,
    }));

    setActiveBagMenu((current) => {
      const currentIndex = BAG_MENUS.findIndex((menu) => menu.id === current);
      const safeIndex = currentIndex >= 0 ? currentIndex : 1;
      const nextIndex =
        direction === 'left'
          ? (safeIndex - 1 + BAG_MENUS.length) % BAG_MENUS.length
          : (safeIndex + 1) % BAG_MENUS.length;

      return BAG_MENUS[nextIndex].id;
    });
  }

  function triggerDetailLight() {
    if (detailLightTimeoutRef.current) {
      window.clearTimeout(detailLightTimeoutRef.current);
    }

    setDetailLightActive(true);
    detailLightTimeoutRef.current = window.setTimeout(() => {
      setDetailLightActive(false);
      detailLightTimeoutRef.current = null;
    }, 1600);
  }

  function handleCreateTeam() {
    const nextId = `team-${Date.now()}`;

    setTeams((current) => [
      ...current,
      {
        id: nextId,
        name: `Time ${current.length + 1}`,
        members: [],
      },
    ]);
    setSelectedTeamId(nextId);
  }

  function handleRenameTeam(teamId, nextName) {
    setTeams((current) =>
      current.map((team) =>
        team.id === teamId
          ? {
              ...team,
              name: nextName.slice(0, 24),
            }
          : team,
      ),
    );
  }

  function handleDeleteTeam(teamId) {
    let nextSelectedId = selectedTeamId;

    setTeams((current) => {
      if (current.length <= 1) {
        const replacementId = `team-${Date.now()}`;
        nextSelectedId = replacementId;
        return [
          {
            id: replacementId,
            name: 'Time 1',
            members: [],
          },
        ];
      }

      const currentIndex = current.findIndex((team) => team.id === teamId);
      const nextTeams = current.filter((team) => team.id !== teamId);

      if (selectedTeamId === teamId) {
        const fallbackTeam =
          nextTeams[currentIndex] ??
          nextTeams[currentIndex - 1] ??
          nextTeams[0] ??
          null;
        nextSelectedId = fallbackTeam?.id ?? nextTeams[0]?.id ?? INITIAL_TEAMS[0].id;
      }

      return nextTeams;
    });

    setSelectedTeamId(nextSelectedId);
  }

  function handleAddSelectedPokemonToTeam(teamId) {
    if (!selectedPokemon) {
      return;
    }

    const member = buildTeamMemberSnapshot(selectedPokemon, selectedPokemonDetailState, currentGeneration);

    setTeams((current) =>
      current.map((team) => {
        if (team.id !== teamId || team.members.length >= 6) {
          return team;
        }

        return {
          ...team,
          members: [...team.members, member],
        };
      }),
    );
    setSelectedTeamId(teamId);
    setIsQuickAddOpen(false);
  }

  function handleRemovePokemonFromTeam(teamId, memberIndex) {
    setTeams((current) =>
      current.map((team) =>
        team.id === teamId
          ? {
              ...team,
              members: team.members.filter((_, index) => index !== memberIndex),
            }
          : team,
      ),
    );
  }

  return (
    <div className="app-shell">
      <div className="app-backdrop" />
      <ItemBag
        activeMenu={activeBagMenuData}
        isOpen={isBagOpen}
        shakeTick={bagShake.tick}
        shakeDirection={bagShake.direction}
        onToggle={() => {
          playButtonSfx();
          setIsBagOpen((current) => !current);
        }}
      />
      <WorldMapButton
        onClick={() => {
          playButtonSfx();
          setMapPopupPhase('opening');
        }}
      />
      <PokeballWidget
        onClick={() => {
          playButtonSfx();
          setIsTeamBuilderOpen(true);
        }}
      />
      <main className="app-container">
        <section id="regioes" className="pokedex-shell">
          <div className="pokedex-main">
            <div className="pokedex-main-accent" aria-hidden="true">
              <span className={detailLightActive ? 'pokedex-main-lens is-active' : 'pokedex-main-lens'} />
              <span className="pokedex-main-ridge" />
            </div>
            <div className="pokedex-top-bar" aria-hidden="true">
              <span className={detailLightActive ? 'dex-light dex-light-red is-active' : 'dex-light dex-light-red'} />
              <span className={detailLightActive ? 'dex-light dex-light-yellow is-active' : 'dex-light dex-light-yellow'} />
              <span className={detailLightActive ? 'dex-light dex-light-green is-active' : 'dex-light dex-light-green'} />
            </div>

            <div className="pokedex-main-body">
              <div className="pokedex-screen-frame">
                <div className="generation-content">
                  {loadingMeta ? <LoadingState label="Montando geracoes..." /> : null}
                  {metaError ? <ErrorState label={metaError} /> : null}

                  {!loadingMeta && !metaError ? (
                    <>
                      {!currentGenerationEntries.length ? (
                        <LoadingState label="Carregando primeiros cards da geracao..." />
                      ) : null}

                      {filteredPokemon.length ? (
                        <div className="pokemon-grid">
                          {filteredPokemon.map((pokemon) => (
                            <PokemonGridCard
                              key={pokemon.id}
                              pokemon={pokemon}
                              isActive={pokemon.id === selectedPokemonId}
                              onSelect={handleSelectPokemon}
                            />
                          ))}
                        </div>
                      ) : null}

                      {normalizedSearch && !filteredPokemon.length && currentGenerationEntries.length ? (
                        <ErrorState label="Nenhum Pokemon encontrado nessa busca." />
                      ) : null}
                    </>
                  ) : null}
                </div>
              </div>

              <div className="pokedex-controls">
                <span className="control-joystick" aria-hidden="true" />
                <div className="control-indicators" aria-hidden="true">
                  <span className="control-indicator control-indicator-red" />
                  <span className="control-indicator control-indicator-blue" />
                </div>
                <label className="control-screen" htmlFor="pokemon-search">
                  <span className="sr-only">Buscar Pokemon por nome ou numero</span>
                  <input
                    id="pokemon-search"
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Nome ou numero"
                    autoComplete="off"
                  />
                </label>
                <span className="control-dpad" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div className="pokedex-hinge" aria-hidden="true">
            <span className="pokedex-hinge-cap pokedex-hinge-cap-top" />
            <span className="pokedex-hinge-slot pokedex-hinge-slot-top" />
            <span className="pokedex-hinge-core" />
            <span className="pokedex-hinge-slot pokedex-hinge-slot-bottom" />
            <span className="pokedex-hinge-cap pokedex-hinge-cap-bottom" />
          </div>

          <aside className="pokedex-side">
            <div className="detail-screen">
              <PokedexDetailPanel
                pokemon={selectedPokemon}
                detailState={selectedPokemonDetailState}
                currentGeneration={normalizedSearch ? selectedPokemon : currentGeneration}
                teams={teams}
                isQuickAddOpen={isQuickAddOpen}
                onToggleQuickAdd={() => {
                  playButtonSfx();
                  setIsQuickAddOpen((current) => !current);
                }}
                onAddToTeam={(teamId) => {
                  playButtonSfx();
                  handleAddSelectedPokemonToTeam(teamId);
                }}
                onCreateTeam={() => {
                  playButtonSfx();
                  handleCreateTeam();
                }}
              />
            </div>

            <div className="detail-button-grid" role="tablist" aria-label="Geracoes">
              {generationMeta.map((generation) => (
                <button
                  key={generation.id}
                  type="button"
                  className={
                    generation.id === selectedGeneration
                      ? 'detail-button-tile active'
                      : 'detail-button-tile'
                  }
                  onClick={() => {
                    playButtonSfx();
                    setSelectedGeneration(generation.id);
                  }}
                  role="tab"
                  aria-selected={generation.id === selectedGeneration}
                  aria-label={`Selecionar ${generation.label}`}
                >
                  <span>{generation.label}</span>
                </button>
              ))}
              <div
                className={detailLightActive ? 'detail-button-circle is-active' : 'detail-button-circle'}
                aria-hidden="true"
              />
            </div>
          </aside>
        </section>

      </main>

      <footer id="footer" className="app-footer">
        <div className="footer-credit">
          <p>
            Dados fornecidos pela{' '}
            <a href="https://pokeapi.co/" target="_blank" rel="noreferrer">
              PokeAPI
            </a>
            , criada por Paul Hallett e contribuidores ao redor do mundo. Pokemon e nomes
            de personagens Pokemon sao marcas da Nintendo.
          </p>
        </div>

        <div className="footer-docs">
          <p>Documentacao oficial</p>
          <p>
            <a href="https://pokeapi.co/docs/v2" target="_blank" rel="noreferrer">
              pokeapi.co/docs/v2
            </a>
          </p>
        </div>

        <div className="footer-contact">
          <FooterLink
            href="https://github.com/jpdevr"
            label="GitHub"
            icon={
              <path d="M12 2C6.48 2 2 6.58 2 12.22c0 4.5 2.87 8.31 6.84 9.65.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.91-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.73 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85 0 1.7.12 2.5.36 1.9-1.32 2.74-1.05 2.74-1.05.56 1.42.21 2.47.1 2.73.64.72 1.03 1.64 1.03 2.76 0 3.93-2.34 4.79-4.57 5.05.36.32.68.94.68 1.89 0 1.37-.01 2.47-.01 2.8 0 .27.18.6.69.49A10.25 10.25 0 0 0 22 12.22C22 6.58 17.52 2 12 2Z" />
            }
          />
          <FooterLink
            href="https://www.linkedin.com/in/jpdevr324/"
            label="LinkedIn"
            icon={
              <>
                <path d="M6.94 8.5a1.44 1.44 0 1 1 0-2.88 1.44 1.44 0 0 1 0 2.88ZM5.7 10.05h2.48V18H5.7v-7.95Zm3.92 0h2.37v1.09h.03c.33-.63 1.14-1.3 2.35-1.3 2.52 0 2.99 1.67 2.99 3.84V18h-2.47v-3.83c0-.91-.02-2.08-1.26-2.08-1.27 0-1.47.99-1.47 2.02V18H9.62v-7.95Z" />
                <path d="M4 4h16v16H4z" fill="none" />
              </>
            }
          />
          <FooterLink
            href="mailto:joaogapires@gmail.com"
            label="joaogapires@gmail.com"
            icon={
              <path d="M3 6.75A1.75 1.75 0 0 1 4.75 5h14.5C20.22 5 21 5.78 21 6.75v10.5A1.75 1.75 0 0 1 19.25 19H4.75A1.75 1.75 0 0 1 3 17.25V6.75Zm1.8.1 7.2 5.26 7.2-5.26a.24.24 0 0 0-.2-.1H5a.24.24 0 0 0-.2.1Zm14.45 1.98-6.73 4.92a.9.9 0 0 1-1.04 0L4.75 8.83v8.42c0 .14.11.25.25.25h14a.25.25 0 0 0 .25-.25V8.83Z" />
            }
          />
        </div>
      </footer>

      <AudioDock
        isMuted={isMuted}
        volume={siteVolume}
        onToggleMute={() => setIsMuted((current) => !current)}
        onVolumeChange={(value) => setSiteVolume(value)}
        onNextTrack={() => setMenuTrackIndex((current) => (current + 1) % MENU_TRACKS.length)}
      />

      {isTeamBuilderOpen ? (
        <TeamBuilderPopup
          teams={teams}
          selectedTeamId={selectedTeam?.id ?? null}
          onSelectTeam={(teamId) => {
            playButtonSfx();
            setSelectedTeamId(teamId);
          }}
          onCreateTeam={() => {
            playButtonSfx();
            handleCreateTeam();
          }}
          onRenameTeam={handleRenameTeam}
          onDeleteTeam={(teamId) => {
            playButtonSfx();
            handleDeleteTeam(teamId);
          }}
          onRemoveMember={(teamId, memberIndex) => {
            playButtonSfx();
            handleRemovePokemonFromTeam(teamId, memberIndex);
          }}
          onRequestClose={() => {
            playButtonSfx();
            setIsTeamBuilderOpen(false);
          }}
        />
      ) : null}

      {isBagOpen ? (
        <BagPopup
          activeMenu={activeBagMenuData}
          inventoryState={activeBagDataState}
          selectedInventoryItem={activeBagSelectedItem}
          canGoLeft={BAG_MENUS.length > 1}
          canGoRight={BAG_MENUS.length > 1}
          onNavigate={handleBagNavigate}
          onSelectInventoryItem={(itemId) => {
            playButtonSfx();
            setBagData((current) => ({
              ...current,
              [activeBagMenu]: {
                ...current[activeBagMenu],
                selectedId: itemId,
              },
            }));
          }}
          onClose={() => {
            playButtonSfx();
            setIsBagOpen(false);
            setActiveBagMenu('key-items');
          }}
        />
      ) : null}

      {mapPopupPhase !== 'closed' ? (
        <WorldMapPopup
          phase={mapPopupPhase}
          onOpenComplete={() => setMapPopupPhase('open')}
          onCloseComplete={() => setMapPopupPhase('closed')}
          onRequestClose={() => {
            playButtonSfx();
            setMapPopupPhase('closing');
          }}
        />
      ) : null}
    </div>
  );
}

function ItemBag({ activeMenu, isOpen, shakeTick, shakeDirection, onToggle }) {
  const [shakeClass, setShakeClass] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setShakeClass('');
      return undefined;
    }

    setShakeClass(shakeDirection === 'left' ? 'shake-left' : 'shake-right');
    const timeoutId = window.setTimeout(() => {
      setShakeClass('');
    }, 420);

    return () => window.clearTimeout(timeoutId);
  }, [isOpen, shakeDirection, shakeTick]);

  return (
    <button
      type="button"
      className={[
        'item-bag',
        isOpen ? 'is-open' : '',
        shakeClass,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-label="Bolsa de itens"
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <span className="item-bag-sprite item-bag-sprite-closed" aria-hidden="true">
        <img src={bagCloseSprite} alt="" className="pixel-art" />
      </span>
      <span className="item-bag-sprite item-bag-sprite-open" aria-hidden="true">
        <img src={activeMenu.sprite} alt="" className="pixel-art" />
      </span>
    </button>
  );
}

function WorldMapButton({ onClick }) {
  return (
    <button
      type="button"
      className="world-map-button"
      aria-label="Mapa do mundo Pokemon"
      onClick={onClick}
    >
      <img src={mapCloseSprite} alt="" className="pixel-art" />
    </button>
  );
}

function WorldMapPopup({ phase, onOpenComplete, onCloseComplete, onRequestClose }) {
  useEffect(() => {
    const duration = phase === 'opening' ? 740 : phase === 'closing' ? 460 : 0;

    if (!duration) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      if (phase === 'opening') {
        onOpenComplete();
      } else {
        onCloseComplete();
      }
    }, duration);

    return () => window.clearTimeout(timeoutId);
  }, [onCloseComplete, onOpenComplete, phase]);

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
    <div className="map-popup-layer" role="presentation" onClick={onRequestClose}>
      <div
        className={`map-popup map-popup-${phase}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mapa do mundo Pokemon"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="map-popup-close"
          onClick={onRequestClose}
          aria-label="Fechar mapa"
        >
          x
        </button>

        <div className="map-popup-shell">
          <div className="map-popup-half map-popup-half-left" aria-hidden="true">
            <img src={mapOpenLeftSprite} alt="" className="pixel-art" />
          </div>

          <div className="map-popup-center" />

          <div className="map-popup-half map-popup-half-right" aria-hidden="true">
            <img src={mapOpenRightSprite} alt="" className="pixel-art" />
          </div>
        </div>
      </div>
    </div>
  );
}

function BagPopup({
  activeMenu,
  inventoryState,
  selectedInventoryItem,
  canGoLeft,
  canGoRight,
  onNavigate,
  onSelectInventoryItem,
  onClose,
}) {
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="bag-popup-layer" role="presentation" onClick={onClose}>
      <div
        className="bag-popup"
        role="dialog"
        aria-modal="true"
        aria-label={`Menu da bolsa: ${activeMenu.label}`}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="bag-nav-button"
          onClick={() => onNavigate('left')}
          aria-label="Ir para o menu anterior"
          disabled={!canGoLeft}
        >
          ‹
        </button>

        <article className="bag-panel">
          <div className="bag-panel-top">
            <span className="bag-panel-chip">{activeMenu.label}</span>
            <button
              type="button"
              className="bag-popup-close"
              onClick={onClose}
              aria-label="Fechar bolsa"
            >
              ×
            </button>
          </div>

          <BagInventoryPanel
            activeMenu={activeMenu}
            inventoryState={inventoryState}
            selectedItem={selectedInventoryItem}
            onSelectItem={onSelectInventoryItem}
          />
        </article>

        <button
          type="button"
          className="bag-nav-button"
          onClick={() => onNavigate('right')}
          aria-label="Ir para o proximo menu"
          disabled={!canGoRight}
        >
          ›
        </button>
      </div>
    </div>
  );
}

function BagInventoryPanel({ activeMenu, inventoryState, selectedItem, onSelectItem }) {
  const listItems = inventoryState.data;
  const menuLabel =
    activeMenu.id === 'pokeballs'
      ? 'Pokebola'
      : activeMenu.id === 'key-items'
        ? 'Key item'
        : 'Item';

  return (
    <div className={`bag-panel-card bag-panel-card-${activeMenu.id}`}>
      <div className="bag-panel-preview">
        <div className="bag-preview-sidebar">
          <span className="bag-preview-rail" aria-hidden="true" />
          <strong className="bag-preview-title">{selectedItem?.displayName ?? menuLabel}</strong>
          {selectedItem?.sprite ? (
            <img
              src={selectedItem.sprite}
              alt={selectedItem.displayName}
              className="bag-item-preview-image pixel-art"
            />
          ) : null}
          <span className="bag-preview-shadow" aria-hidden="true" />
        </div>

        <div className="bag-preview-main">
          <div className="bag-panel-content">
        {inventoryState.status === 'loading' ? (
          <div className="bag-panel-empty">
            <div className="spinner" />
            <span>Carregando {activeMenu.label}...</span>
          </div>
        ) : null}

        {inventoryState.status === 'error' ? (
          <div className="bag-panel-empty">
            <span>{inventoryState.error}</span>
          </div>
        ) : null}

        {inventoryState.status === 'success' ? (
          <div className="bag-ball-list" role="list" aria-label={`Lista de ${activeMenu.label}`}>
            {listItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={selectedItem?.id === item.id ? 'bag-ball-row active' : 'bag-ball-row'}
                onClick={() => onSelectItem(item.id)}
              >
                <span className="bag-ball-name">{item.displayName}</span>
                <span className="bag-ball-qty">x{item.quantity}</span>
              </button>
            ))}
          </div>
        ) : null}
          </div>

          <div className="bag-item-preview-copy">
            <strong>Descricao</strong>
            <p>
              {selectedItem?.description ??
                `Selecione um ${menuLabel.toLowerCase()} para ver os detalhes completos.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function PokemonGridCard({ pokemon, isActive, onSelect }) {
  return (
    <button
      type="button"
      className={isActive ? 'pokemon-card active' : 'pokemon-card'}
      onClick={() => onSelect(pokemon.id)}
    >
      <span className="pokemon-card-id">#{formatId(pokemon.id)}</span>
      <img
        src={getCardSprite(pokemon.id)}
        alt={pokemon.displayName}
        className="pokemon-card-sprite pixel-art"
        loading="lazy"
        data-pokemon-id={pokemon.id}
        onError={handleCardSpriteError}
      />
      <strong title={pokemon.displayName}>{pokemon.displayName}</strong>
    </button>
  );
}

function PokedexDetailPanel({
  pokemon,
  detailState,
  currentGeneration,
  teams,
  isQuickAddOpen,
  onToggleQuickAdd,
  onAddToTeam,
  onCreateTeam,
}) {
  const detail = detailState?.status === 'success' ? detailState.data : null;

  if (!pokemon) {
    return (
      <div className="detail-screen-empty">
        <span className="detail-id">----</span>
        <h2>Aguardando leitura</h2>
        <p>Escolha um Pokemon na tela principal para ver a ficha detalhada aqui.</p>
      </div>
    );
  }

  return (
    <div className="detail-screen-content">
      <span className="detail-id">#{formatId(pokemon.id)}</span>
      <div className="detail-actions">
        <button type="button" className="detail-add-button" onClick={onToggleQuickAdd} aria-label="Adicionar ao time">
          +
        </button>

        {isQuickAddOpen ? (
          <div className="detail-add-menu">
            <strong>Adicionar ao time</strong>
            <div className="detail-add-list">
              {teams.map((team) => {
                const isFull = team.members.length >= 6;

                return (
                  <button
                    key={team.id}
                    type="button"
                    className="detail-add-option"
                    onClick={() => onAddToTeam(team.id)}
                    disabled={isFull}
                  >
                    <span>{team.name}</span>
                    <small>{isFull ? 'Cheio' : `${team.members.length}/6`}</small>
                  </button>
                );
              })}
            </div>
            <button type="button" className="detail-add-create" onClick={onCreateTeam}>
              + Novo time
            </button>
          </div>
        ) : null}
      </div>
      <h2>{detail?.displayName ?? pokemon.displayName}</h2>
      <p className="detail-flavor">
        {detail?.flavor ?? 'Buscando descricao completa e registros da Pokedex...'}
      </p>

      <div className="detail-hero">
        {detail?.image ? (
          <img src={detail.image} alt={detail.name} className="pixel-art detail-sprite" />
        ) : (
          <div className="detail-sprite-placeholder" />
        )}
        <div className="detail-meta">
          <div>
            <span>Regiao</span>
            <strong>{currentGeneration?.generationLabel ?? currentGeneration?.label ?? 'Dex'}</strong>
          </div>
          <div>
            <span>Altura</span>
            <strong>{detail?.heightLabel ?? '--'}</strong>
          </div>
          <div>
            <span>Peso</span>
            <strong>{detail?.weightLabel ?? '--'}</strong>
          </div>
        </div>

        <div className="detail-abilities">
          <span>Habilidades</span>
          <strong>{detail?.abilities?.join(', ') ?? 'Carregando...'}</strong>
        </div>
      </div>

      <div className="detail-types">
        {(detail?.types ?? []).map((type) => (
          <TypeBadge key={type} type={type} />
        ))}
      </div>
    </div>
  );
}

function TypeBadge({ type }) {
  return (
    <span className="type-badge" style={{ '--type-color': TYPE_COLORS[type] ?? '#74828f' }}>
      {capitalize(type)}
    </span>
  );
}

function LoadingState({ label }) {
  return (
    <div className="status-card">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  );
}

function ErrorState({ label }) {
  return (
    <div className="status-card error">
      <span>{label}</span>
    </div>
  );
}

function FooterLink({ href, label, icon }) {
  return (
    <a href={href} target={href.startsWith('mailto:') ? undefined : '_blank'} rel="noreferrer">
      <span className="footer-link-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor">
          {icon}
        </svg>
      </span>
      <span>{label}</span>
    </a>
  );
}

function PokeballWidget({ onClick }) {
  return (
    <button type="button" className="pokeball-widget" aria-label="Abrir team builder" onClick={onClick}>
      <span className="pokeball-sprite pokeball-sprite-closed">
        <img src={pokeballCloseSprite} alt="" className="pixel-art" />
      </span>
      <span className="pokeball-sprite pokeball-sprite-hover">
        <img src={pokeballSemiOpenSprite} alt="" className="pixel-art" />
      </span>
    </button>
  );
}

function AudioDock({ isMuted, volume, onToggleMute, onVolumeChange, onNextTrack }) {
  return (
    <div className="audio-dock">
      <div className="audio-panel">
        <button type="button" className="audio-next" onClick={onNextTrack} aria-label="Passar para a proxima musica">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6.5 6.25a.75.75 0 0 1 1.2-.6l7.3 5.6a.94.94 0 0 1 0 1.5l-7.3 5.6a.75.75 0 0 1-1.2-.6V6.25Z" />
            <path d="M16.75 5.5a.75.75 0 0 1 1.5 0v13a.75.75 0 0 1-1.5 0v-13Z" />
          </svg>
        </button>

        <label className="audio-slider" aria-label="Volume do site">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={volume}
            onChange={(event) => onVolumeChange(Number(event.target.value))}
            aria-label="Volume do site"
          />
        </label>
      </div>

      <button
        type="button"
        className="audio-toggle"
        onClick={onToggleMute}
        aria-label={isMuted ? 'Ativar som do site' : 'Mutar som do site'}
        aria-pressed={isMuted}
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          {isMuted ? (
            <>
              <path d="M14.5 4.5v15a.5.5 0 0 1-.84.36L8.8 15.5H5a1.5 1.5 0 0 1-1.5-1.5v-4A1.5 1.5 0 0 1 5 8.5h3.8l4.86-4.36a.5.5 0 0 1 .84.36Z" />
              <path d="M18.03 8.56 15.59 11l2.44 2.44-1.06 1.06L14.53 12.06l-2.44 2.44-1.06-1.06L13.47 11l-2.44-2.44 1.06-1.06 2.44 2.44 2.44-2.44 1.06 1.06Z" />
            </>
          ) : (
            <>
              <path d="M14.5 4.5v15a.5.5 0 0 1-.84.36L8.8 15.5H5a1.5 1.5 0 0 1-1.5-1.5v-4A1.5 1.5 0 0 1 5 8.5h3.8l4.86-4.36a.5.5 0 0 1 .84.36Z" />
              <path d="M17.36 8.03a.75.75 0 0 1 1.06 0 4.95 4.95 0 0 1 0 6.94.75.75 0 1 1-1.06-1.06 3.45 3.45 0 0 0 0-4.82.75.75 0 0 1 0-1.06Z" />
              <path d="M19.92 5.47a.75.75 0 0 1 1.06 0 8.56 8.56 0 0 1 0 12.06.75.75 0 0 1-1.06-1.06 7.06 7.06 0 0 0 0-9.94.75.75 0 0 1 0-1.06Z" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}

async function fetchGenerationMeta() {
  const responses = await Promise.all(
    GENERATIONS.map(async (generation) => {
      const data = await fetchJsonWithTimeout(
        `${API_BASE}/generation/${generation.id}`,
        `generation ${generation.id}`,
      );
      const pokemonEntries = data.pokemon_species
        .map((species) => ({
          id: extractId(species.url),
          name: species.name,
          displayName: formatName(species.name),
          generationId: generation.id,
          generationLabel: generation.label,
        }))
        .filter((species) => Number.isInteger(species.id))
        .sort((a, b) => a.id - b.id);

      return {
        ...generation,
        pokemonEntries,
      };
    }),
  );

  return responses;
}

async function fetchGenerationMetaCached() {
  if (generationMetaCache.data) {
    return generationMetaCache.data;
  }

  if (!generationMetaCache.promise) {
    generationMetaCache.promise = fetchGenerationMeta()
      .then((meta) => {
        generationMetaCache.data = meta;
        return meta;
      })
      .catch((error) => {
        generationMetaCache.promise = null;
        throw error;
      });
  }

  return generationMetaCache.promise;
}

async function fetchPokeballItems() {
  if (pokeballCache.status === 'success') {
    return pokeballCache.data;
  }

  if (pokeballCache.status === 'loading' && pokeballCache.promise) {
    return pokeballCache.promise;
  }

  pokeballCache.status = 'loading';
  pokeballCache.promise = Promise.allSettled(
    POKEBALL_ITEM_NAMES.map((name) =>
      fetchJsonWithTimeout(`${API_BASE}/item/${name}`, `item ${name}`)
    ),
  )
    .then((results) => {
      const items = results
        .filter((result) => result.status === 'fulfilled')
        .map((result, index) => mapPokeballItem(result.value, index));

      if (!items.length) {
        throw new Error('No pokeball items were loaded');
      }

      const sortedItems = items.sort((a, b) => a.id - b.id);
      pokeballCache.status = 'success';
      pokeballCache.data = sortedItems;
      pokeballCache.error = '';

      return sortedItems;
    })
    .catch((error) => {
      pokeballCache.status = 'error';
      pokeballCache.data = [];
      pokeballCache.error = error.message;
      throw error;
    });

  return pokeballCache.promise;
}

async function fetchPocketItems(pocketName, limit = BAG_ITEM_FETCH_LIMIT) {
  const cacheKey = `${pocketName}:${limit}`;

  if (bagPocketCache.has(cacheKey)) {
    return bagPocketCache.get(cacheKey);
  }

  const promise = fetchJsonWithTimeout(`${API_BASE}/item-pocket/${pocketName}`, `pocket ${pocketName}`)
    .then(async (pocket) => {
      const categories = await Promise.all(
        pocket.categories.map((category) =>
          fetchJsonWithTimeout(category.url, `category ${category.name}`),
        ),
      );

      const uniqueItems = new Map();

      categories.forEach((category) => {
        category.items.forEach((item) => {
          if (!uniqueItems.has(item.name)) {
            uniqueItems.set(item.name, item.url);
          }
        });
      });

      const sortedItems = [...uniqueItems.values()]
        .sort((a, b) => extractId(a) - extractId(b))
        .slice(0, limit);

      const itemResults = await Promise.allSettled(
        sortedItems.map((url) => fetchJsonWithTimeout(url, `item ${url}`)),
      );

      const items = itemResults
        .filter((result) => result.status === 'fulfilled')
        .map((result, index) => mapInventoryItem(result.value, index));

      if (!items.length) {
        throw new Error(`No items loaded for ${pocketName}`);
      }

      return items.sort((a, b) => a.id - b.id);
    })
    .catch((error) => {
      bagPocketCache.delete(cacheKey);
      throw error;
    });

  bagPocketCache.set(cacheKey, promise);
  return promise;
}

async function fetchJsonWithTimeout(url, label, timeoutMs = 12000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`${label} failed`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`${label} timed out`);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function primePokemonDetails(id, setPokemonDetailCache) {
  setPokemonDetailCache((current) => {
    if (current[id]?.status) {
      return current;
    }

    return {
      ...current,
      [id]: { status: 'loading' },
    };
  });

  try {
    const detail = await fetchPokemonDetails(id);

    setPokemonDetailCache((current) => ({
      ...current,
      [id]: {
        status: 'success',
        data: detail,
      },
    }));
  } catch (error) {
    setPokemonDetailCache((current) => ({
      ...current,
      [id]: {
        status: 'error',
      },
    }));
  }
}

async function fetchPokemonDetails(id) {
  if (!pokemonDetailRequestCache.has(id)) {
    pokemonDetailRequestCache.set(
      id,
      Promise.all([
        fetchJsonWithTimeout(`${API_BASE}/pokemon/${id}`, `pokemon ${id}`),
        fetchJsonWithTimeout(`${API_BASE}/pokemon-species/${id}`, `pokemon species ${id}`),
      ])
        .then(([pokemon, species]) => {
          const flavor =
            species.flavor_text_entries.find((entry) => entry.language.name === 'en')
              ?.flavor_text ?? 'No description available.';
          const cleanFlavor = cleanText(flavor);

          return {
            id: pokemon.id,
            name: pokemon.name,
            displayName: formatName(pokemon.name),
            image: getAnimatedPixelSprite(pokemon),
            cryUrl: pokemon.cries?.legacy ?? pokemon.cries?.latest ?? null,
            types: pokemon.types.map((item) => item.type.name),
            abilities: pokemon.abilities.map((item) => formatName(item.ability.name)),
            heightLabel: `${(pokemon.height / 10).toFixed(1)} m`,
            weightLabel: `${(pokemon.weight / 10).toFixed(1)} kg`,
            flavor: cleanFlavor,
            shortFlavor: truncate(cleanFlavor, 108),
          };
        })
        .catch((error) => {
          pokemonDetailRequestCache.delete(id);
          throw error;
        }),
    );
  }

  return pokemonDetailRequestCache.get(id);
}

function mapPokeballItem(item, index) {
  const englishName =
    item.names?.find((entry) => entry.language.name === 'en')?.name ?? formatName(item.name);
  const description =
    item.flavor_text_entries
      ?.filter((entry) => entry.language.name === 'en')
      .at(-1)?.text ??
    item.effect_entries?.find((entry) => entry.language.name === 'en')?.effect ??
    'Pokebola pronta para captura.';

  return {
    id: item.id,
    name: item.name,
    displayName: englishName,
    description: cleanText(description),
    sprite: item.sprites?.default ?? '',
    quantity: index < 3 ? 1 : Math.max(2, 9 - index),
  };
}

function mapInventoryItem(item, index) {
  const englishName =
    item.names?.find((entry) => entry.language.name === 'en')?.name ?? formatName(item.name);
  const description =
    item.flavor_text_entries
      ?.filter((entry) => entry.language.name === 'en')
      .at(-1)?.text ??
    item.effect_entries?.find((entry) => entry.language.name === 'en')?.effect ??
    'Item pronto para uso.';

  return {
    id: item.id,
    name: item.name,
    displayName: englishName,
    description: cleanText(description),
    sprite: item.sprites?.default ?? '',
    quantity: index < 4 ? 1 : Math.max(2, 12 - index),
  };
}

function getAnimatedPixelSprite(pokemon) {
  return (
    pokemon.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default ??
    pokemon.sprites.other?.showdown?.front_default ??
    pokemon.sprites.versions?.['generation-v']?.['black-white']?.front_default ??
    pokemon.sprites.versions?.['generation-iv']?.['heartgold-soulsilver']?.front_default ??
    pokemon.sprites.front_default
  );
}

function playPokemonCry(url) {
  if (!url || typeof Audio === 'undefined') {
    return;
  }

  const audio = new Audio(url);
  audio.volume = getEffectVolume(0.8);
  audio.play().catch(() => {});
}

function playButtonSfx() {
  if (typeof Audio === 'undefined') {
    return;
  }

  const audio = new Audio(buttonSfx);
  audio.volume = getEffectVolume(0.28);
  audio.play().catch(() => {});
}

function getEffectVolume(multiplier = 1) {
  if (audioSettings.muted) {
    return 0;
  }

  return clampVolume(audioSettings.volume * multiplier);
}

function getAmbientVolume() {
  if (audioSettings.muted) {
    return 0;
  }

  return clampVolume(audioSettings.volume * 0.18);
}

function clampVolume(value) {
  return Math.min(1, Math.max(0, value));
}

function getCardSprite(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;
}

function getStaticCardSprite(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/${id}.png`;
}

function buildTeamMemberSnapshot(pokemon, detailState, currentGeneration) {
  const detail = detailState?.status === 'success' ? detailState.data : null;

  return {
    id: `${pokemon.id}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    pokemonId: pokemon.id,
    name: pokemon.name,
    displayName: detail?.displayName ?? pokemon.displayName,
    sprite: detail?.image ?? getCardSprite(pokemon.id),
    types: detail?.types ?? [],
    generationLabel: currentGeneration?.generationLabel ?? currentGeneration?.label ?? 'Dex',
  };
}

function handleCardSpriteError(event) {
  const image = event.currentTarget;
  const fallbackSrc = getStaticCardSprite(image.dataset.pokemonId ?? '');

  if (image.src === fallbackSrc) {
    image.onerror = null;
    image.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${image.dataset.pokemonId}.png`;
    return;
  }

  image.src = fallbackSrc;
}

function extractId(url) {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? Number(match[1]) : null;
}

function formatName(value) {
  return value
    .split('-')
    .map((part) => capitalize(part))
    .join(' ');
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatId(id) {
  return String(id).padStart(4, '0');
}

function truncate(text, size) {
  if (text.length <= size) {
    return text;
  }

  return `${text.slice(0, size - 1)}...`;
}

function cleanText(text) {
  return text.replace(/\f|\n|\r/g, ' ').replace(/\s+/g, ' ').trim();
}

export default App;


