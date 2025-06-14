// src/components/maps/core/useDistanceCircle.ts - FIXED: Proper cleanup of radius labels
import { useEffect, useRef } from 'react';
import L from 'leaflet';

interface DistanceCircleOptions {
  center: [number, number] | null;
  radius: number;
  enabled: boolean;
  locationName?: string;
}

export const useDistanceCircle = (
  map: L.Map | null,
  options: DistanceCircleOptions
) => {
  const circleRef = useRef<L.Circle | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tooltipRef = useRef<L.Tooltip | null>(null);
  const radiusLabelsRef = useRef<L.Marker[]>([]); // NEW: Store radius labels for cleanup

  useEffect(() => {
    if (!map) return;

    // Clear existing circle, marker, tooltip, and radius labels
    if (circleRef.current) {
      map.removeLayer(circleRef.current);
      circleRef.current = null;
    }

    if (markerRef.current) {
      map.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    if (tooltipRef.current) {
      map.removeLayer(tooltipRef.current);
      tooltipRef.current = null;
    }

    // FIXED: Clean up all radius labels
    radiusLabelsRef.current.forEach((label) => {
      if (map.hasLayer(label)) {
        map.removeLayer(label);
      }
    });
    radiusLabelsRef.current = [];

    // Add new circle and marker if enabled
    if (options.enabled && options.center) {
      try {
        // Create the search radius circle
        const circle = L.circle(options.center, {
          radius: options.radius * 1000, // Convert km to meters
          fillColor: '#3b82f6',
          fillOpacity: 0.08,
          color: '#3b82f6',
          weight: 2,
          opacity: 0.6,
          dashArray: '8, 8',
          interactive: false,
        }).addTo(map);

        // Create center marker
        const centerIcon = L.divIcon({
          className: 'distance-center-marker',
          html: `
            <div style="
              width: 24px;
              height: 24px;
              background: #3b82f6;
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
            ">
              <div style="
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
              "></div>
              <!-- Pulse animation rings -->
              <div style="
                position: absolute;
                width: 100%;
                height: 100%;
                border: 2px solid #3b82f6;
                border-radius: 50%;
                animation: pulse-ring 2s infinite;
                opacity: 0.6;
              "></div>
              <div style="
                position: absolute;
                width: 120%;
                height: 120%;
                border: 1px solid #3b82f6;
                border-radius: 50%;
                animation: pulse-ring 2s infinite 0.5s;
                opacity: 0.4;
              "></div>
            </div>
            <style>
              @keyframes pulse-ring {
                0% {
                  transform: scale(1);
                  opacity: 0.6;
                }
                50% {
                  transform: scale(1.3);
                  opacity: 0.3;
                }
                100% {
                  transform: scale(1.6);
                  opacity: 0;
                }
              }
            </style>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const centerMarker = L.marker(options.center, {
          icon: centerIcon,
          interactive: false,
          zIndexOffset: 1000,
        }).addTo(map);

        // FIXED: Create radius labels at cardinal points and store them
        const cardinalPoints = [
          { angle: 0, label: 'N' },
          { angle: 90, label: 'E' },
          { angle: 180, label: 'S' },
          { angle: 270, label: 'W' },
        ];

        const newRadiusLabels: L.Marker[] = [];

        cardinalPoints.forEach((point) => {
          // Calculate position for radius label
          const lat =
            options.center![0] +
            (options.radius / 111.32) * Math.cos((point.angle * Math.PI) / 180);
          const lng =
            options.center![1] +
            (options.radius /
              (111.32 * Math.cos((options.center![0] * Math.PI) / 180))) *
              Math.sin((point.angle * Math.PI) / 180);

          const radiusLabel = L.marker([lat, lng], {
            icon: L.divIcon({
              className: 'radius-label',
              html: `
                <div style="
                  background: rgba(59, 130, 246, 0.9);
                  color: white;
                  padding: 2px 6px;
                  border-radius: 12px;
                  font-size: 10px;
                  font-weight: 600;
                  white-space: nowrap;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                  border: 1px solid rgba(255,255,255,0.3);
                ">
                  ${options.radius < 1 ? `${Math.round(options.radius * 1000)}m` : `${options.radius}km`}
                </div>
              `,
              iconSize: [40, 20],
              iconAnchor: [20, 10],
            }),
            interactive: false,
            zIndexOffset: 500,
          }).addTo(map);

          // Store the label for cleanup
          newRadiusLabels.push(radiusLabel);
        });

        // Store all radius labels in ref
        radiusLabelsRef.current = newRadiusLabels;

        // Create info tooltip
        if (options.locationName) {
          const tooltip = L.tooltip({
            permanent: true,
            direction: 'top',
            offset: [0, -35],
            className: 'distance-info-tooltip',
          })
            .setContent(
              `
            <div style="
              background: rgba(0,0,0,0.8);
              color: white;
              padding: 8px 12px;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 500;
              text-align: center;
              min-width: 120px;
              border: 1px solid rgba(255,255,255,0.2);
            ">
              <div style="font-weight: 600; margin-bottom: 2px;">
                ${options.locationName}
              </div>
              <div style="font-size: 10px; opacity: 0.9;">
                ${options.radius < 1 ? `${Math.round(options.radius * 1000)}m` : `${options.radius}km`} search radius
              </div>
            </div>
          `
            )
            .setLatLng(options.center);

          centerMarker.bindTooltip(tooltip);
          tooltipRef.current = tooltip;
        }

        // Store references
        circleRef.current = circle;
        markerRef.current = centerMarker;

        // FIXED: Add circle interaction events with proper typing
        circle.on('mouseover', function (this: L.Circle) {
          this.setStyle({
            fillOpacity: 0.15,
            opacity: 0.8,
            weight: 3,
          });
        });

        circle.on('mouseout', function (this: L.Circle) {
          this.setStyle({
            fillOpacity: 0.08,
            opacity: 0.6,
            weight: 2,
          });
        });
      } catch (error) {
        console.error('Error creating distance circle:', error);
      }
    }
  }, [
    map,
    options.center,
    options.radius,
    options.enabled,
    options.locationName,
  ]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (map) {
        if (circleRef.current) {
          map.removeLayer(circleRef.current);
        }
        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }
        if (tooltipRef.current) {
          map.removeLayer(tooltipRef.current);
        }
        // Clean up radius labels on unmount
        radiusLabelsRef.current.forEach((label) => {
          if (map.hasLayer(label)) {
            map.removeLayer(label);
          }
        });
      }
    };
  }, [map]);
};
