import { useEffect, useRef, useState } from 'react';
import mapOpenLeftSprite from './assets/MapOpenleft.png';
import mapOpenRightSprite from './assets/MapOpenright.png';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  const [dragState, setDragState] = useState(null);
  const canvasRef = useRef(null);

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
  }, [map?.id]);

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
        aria-label={`Mapa de ${mapLabel}`}
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
                    <strong>{mapLabel}</strong>
                    <span>{zoom.toFixed(1)}x zoom</span>
                  </div>
                </div>

                <div
                  className={zoom > 1 ? 'region-map-stage is-zoomed' : 'region-map-stage'}
                  onWheel={handleViewportWheel}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={clearDrag}
                  onPointerCancel={clearDrag}
                >
                  <div
                    ref={canvasRef}
                    className="region-map-canvas"
                    style={{
                      transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    }}
                  >
                    <img src={map.src} alt={mapLabel} className="map-popup-map-image" />
                  </div>
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
