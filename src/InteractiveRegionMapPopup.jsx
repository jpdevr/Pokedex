import { useEffect, useMemo, useRef, useState } from 'react';
import mapOpenLeftSprite from './assets/MapOpenleft.png';
import mapOpenRightSprite from './assets/MapOpenright.png';
import { fetchLocationDetails } from './regionMapApi';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatTooltip(hotspot) {
  return hotspot.kind ? `${hotspot.label} (${hotspot.kind})` : hotspot.label;
}

function getPopupPosition(stageRect, hotspotRect, popupWidth = 300, popupHeight = 280) {
  let left = hotspotRect.right - stageRect.left + 16;
  let top = hotspotRect.top - stageRect.top - 8;

  if (left + popupWidth > stageRect.width - 12) {
    left = hotspotRect.left - stageRect.left - popupWidth - 16;
  }

  return {
    left: clamp(left, 12, Math.max(12, stageRect.width - popupWidth - 12)),
    top: clamp(top, 12, Math.max(12, stageRect.height - popupHeight - 12)),
  };
}

function MapHotspotButton({ hotspot, isActive, isHovered, onHover, onLeave, onSelect, buttonRef }) {
  return (
    <button
      ref={buttonRef}
      type="button"
      title={formatTooltip(hotspot)}
      aria-label={formatTooltip(hotspot)}
      className={[
        'region-map-hotspot',
        hotspot.kind ? `region-map-hotspot-${hotspot.kind.toLowerCase()}` : '',
        isActive ? 'is-active' : '',
        isHovered ? 'is-hovered' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: `${hotspot.x}%`,
        top: `${hotspot.y}%`,
        width: `${hotspot.width}%`,
        height: `${hotspot.height}%`,
      }}
      onMouseEnter={() => onHover(hotspot.id)}
      onMouseLeave={onLeave}
      onFocus={() => onHover(hotspot.id)}
      onBlur={onLeave}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(hotspot);
      }}
    >
      <span className="region-map-hotspot-outline" />
      <span className="region-map-hotspot-alias">{hotspot.label}</span>
    </button>
  );
}

function HotspotPopup({ hotspot, locationState, position, onClose }) {
  const isLoading = locationState.status === 'loading';
  const isError = locationState.status === 'error';
  const details = locationState.status === 'success' ? locationState.data : null;
  const visiblePokemon = details?.pokemon.slice(0, 12) ?? [];
  const remainingCount = Math.max(0, (details?.pokemon.length ?? 0) - visiblePokemon.length);

  return (
    <aside className="region-map-location-popup" style={position}>
      <button type="button" className="region-map-location-popup-close" onClick={onClose} aria-label="Fechar detalhes do local">
        x
      </button>

      <div className="region-map-location-copy">
        <span className="region-map-location-kind">{hotspot.kind}</span>
        <strong>{hotspot.label}</strong>
      </div>

      {isLoading ? <p className="region-map-location-meta">Carregando dados da PokeAPI...</p> : null}
      {isError ? <p className="region-map-location-meta">Nao foi possivel carregar esse local agora.</p> : null}

      {details ? (
        <>
          <p className="region-map-location-meta">
            {details.encounterAreaCount > 0
              ? `${details.pokemon.length} pokemon encontrados em ${details.encounterAreaCount} area(s).`
              : 'A PokeAPI nao registra encontros selvagens para esse local.'}
          </p>

          {visiblePokemon.length ? (
            <div className="region-map-encounter-grid">
              {visiblePokemon.map((pokemon) => (
                <article key={pokemon.name} className="region-map-encounter-card">
                  {pokemon.sprite ? (
                    <img
                      src={pokemon.sprite}
                      alt=""
                      className="region-map-encounter-sprite pixel-art"
                      loading="lazy"
                    />
                  ) : null}
                  <div>
                    <strong>{pokemon.displayName}</strong>
                    <small>{pokemon.methods.slice(0, 2).join(', ') || 'Wild encounter'}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {remainingCount > 0 ? <p className="region-map-location-more">+{remainingCount} outros pokemon nessa area.</p> : null}
        </>
      ) : null}
    </aside>
  );
}

export default function InteractiveRegionMapPopup({
  phase,
  map,
  mapLabel,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  onOpenComplete,
  onCloseComplete,
  onRequestClose,
}) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [hoveredHotspotId, setHoveredHotspotId] = useState(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [locationState, setLocationState] = useState({ status: 'idle', data: null });
  const [popupPosition, setPopupPosition] = useState({ left: 16, top: 16 });
  const [dragState, setDragState] = useState(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const hotspotRefs = useRef(new Map());

  const hotspots = map?.hotspots ?? [];
  const selectedHotspot = useMemo(
    () => hotspots.find((hotspot) => hotspot.id === selectedHotspotId) ?? null,
    [hotspots, selectedHotspotId],
  );

  useEffect(() => {
    const duration = phase === 'opening' ? 980 : phase === 'closing' ? 620 : 0;

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

  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setHoveredHotspotId(null);
    setSelectedHotspotId(null);
    setLocationState({ status: 'idle', data: null });
  }, [map?.id]);

  useEffect(() => {
    if (!selectedHotspot?.apiLocation) {
      setLocationState({ status: 'idle', data: null });
      return;
    }

    let active = true;
    setLocationState({ status: 'loading', data: null });

    fetchLocationDetails(selectedHotspot.apiLocation)
      .then((data) => {
        if (active) {
          setLocationState({ status: 'success', data });
        }
      })
      .catch(() => {
        if (active) {
          setLocationState({ status: 'error', data: null });
        }
      });

    return () => {
      active = false;
    };
  }, [selectedHotspot?.apiLocation]);

  useEffect(() => {
    if (!selectedHotspot) {
      return undefined;
    }

    function syncPopupPosition() {
      const stageNode = stageRef.current;
      const hotspotNode = hotspotRefs.current.get(selectedHotspot.id);

      if (!stageNode || !hotspotNode) {
        return;
      }

      const stageRect = stageNode.getBoundingClientRect();
      const hotspotRect = hotspotNode.getBoundingClientRect();
      setPopupPosition(getPopupPosition(stageRect, hotspotRect));
    }

    syncPopupPosition();
    window.addEventListener('resize', syncPopupPosition);

    return () => window.removeEventListener('resize', syncPopupPosition);
  }, [selectedHotspot, zoom, pan]);

  function clampPan(nextPan, nextZoom = zoom) {
    const canvasNode = canvasRef.current;

    if (!canvasNode) {
      return nextPan;
    }

    const maxX = Math.max(0, ((canvasNode.clientWidth * nextZoom) - canvasNode.clientWidth) / 2);
    const maxY = Math.max(0, ((canvasNode.clientHeight * nextZoom) - canvasNode.clientHeight) / 2);

    return {
      x: clamp(nextPan.x, -maxX, maxX),
      y: clamp(nextPan.y, -maxY, maxY),
    };
  }

  function updateZoom(nextZoom) {
    const safeZoom = clamp(Number(nextZoom.toFixed(2)), 1, 2.8);
    setZoom(safeZoom);
    setPan((current) => clampPan(current, safeZoom));
  }

  function handleViewportWheel(event) {
    event.preventDefault();
    updateZoom(zoom + (event.deltaY < 0 ? 0.14 : -0.14));
  }

  function handlePointerDown(event) {
    if (zoom <= 1) {
      return;
    }

    if (event.target.closest('.region-map-hotspot') || event.target.closest('.region-map-location-popup')) {
      return;
    }

    setDragState({
      pointerId: event.pointerId,
      originX: event.clientX,
      originY: event.clientY,
      startPan: pan,
    });
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    const nextPan = {
      x: dragState.startPan.x + (event.clientX - dragState.originX),
      y: dragState.startPan.y + (event.clientY - dragState.originY),
    };

    setPan(clampPan(nextPan));
  }

  function clearDrag(event) {
    if (!dragState || event.pointerId !== dragState.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setDragState(null);
  }

  return (
    <div className="map-popup-layer" role="presentation" onClick={onRequestClose}>
      <div
        className={`map-popup map-popup-${phase}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Mapa interativo de ${mapLabel}`}
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

        <div className="map-popup-actions">
          <button
            type="button"
            className="map-popup-nav"
            onClick={(event) => {
              event.stopPropagation();
              onPrevious();
            }}
            disabled={!hasPrevious}
          >
            {'<'}
          </button>

          <span className="map-popup-title">{mapLabel}</span>

          <button
            type="button"
            className="map-popup-nav"
            onClick={(event) => {
              event.stopPropagation();
              onNext();
            }}
            disabled={!hasNext}
          >
            {'>'}
          </button>
        </div>

        <div className="map-popup-shell">
          <div className="map-popup-half map-popup-half-left" aria-hidden="true">
            <img src={mapOpenLeftSprite} alt="" className="pixel-art" />
          </div>

          <div className="map-popup-center">
            {map ? (
              <div className="map-popup-map">
                <div className="region-map-toolbar">
                  <div className="region-map-toolbar-group">
                    <button type="button" className="region-map-toolbar-button" onClick={() => updateZoom(zoom - 0.2)}>
                      -
                    </button>
                    <button type="button" className="region-map-toolbar-button" onClick={() => updateZoom(zoom + 0.2)}>
                      +
                    </button>
                    <button
                      type="button"
                      className="region-map-toolbar-button region-map-toolbar-reset"
                      onClick={() => {
                        setZoom(1);
                        setPan({ x: 0, y: 0 });
                      }}
                    >
                      Reset
                    </button>
                  </div>

                  <div className="region-map-toolbar-copy">
                    <strong>{hoveredHotspotId ? hotspots.find((hotspot) => hotspot.id === hoveredHotspotId)?.label : 'Passe o mouse nos hotspots'}</strong>
                    <span>{zoom.toFixed(1)}x zoom</span>
                  </div>
                </div>

                <div
                  ref={stageRef}
                  className={zoom > 1 ? 'region-map-stage is-zoomed' : 'region-map-stage'}
                  onWheel={handleViewportWheel}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={clearDrag}
                  onPointerCancel={clearDrag}
                  onClick={() => setSelectedHotspotId(null)}
                >
                  <div
                    ref={canvasRef}
                    className="region-map-canvas"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    }}
                  >
                    <img src={map.src} alt={mapLabel} className="map-popup-map-image" />

                    <div className="region-map-hotspot-layer">
                      {hotspots.map((hotspot) => (
                        <MapHotspotButton
                          key={hotspot.id}
                          hotspot={hotspot}
                          isActive={hotspot.id === selectedHotspotId}
                          isHovered={hotspot.id === hoveredHotspotId}
                          onHover={setHoveredHotspotId}
                          onLeave={() => setHoveredHotspotId(null)}
                          onSelect={(nextHotspot) => setSelectedHotspotId(nextHotspot.id)}
                          buttonRef={(node) => {
                            if (node) {
                              hotspotRefs.current.set(hotspot.id, node);
                            } else {
                              hotspotRefs.current.delete(hotspot.id);
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {selectedHotspot ? (
                    <HotspotPopup
                      hotspot={selectedHotspot}
                      locationState={locationState}
                      position={popupPosition}
                      onClose={() => setSelectedHotspotId(null)}
                    />
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="map-popup-empty">Nenhum mapa disponivel</div>
            )}
          </div>

          <div className="map-popup-half map-popup-half-right" aria-hidden="true">
            <img src={mapOpenRightSprite} alt="" className="pixel-art" />
          </div>
        </div>
      </div>
    </div>
  );
}
