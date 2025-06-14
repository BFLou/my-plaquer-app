// src/components/maps/features/InteractivePopup.tsx
import React from 'react';
import {
  Eye,
  Heart,
  Clock,
  Plus,
  MapPin,
  User,
  Building,
  Share2,
} from 'lucide-react';
import { Plaque } from '@/types/plaque';
import { isMobile, triggerHapticFeedback } from '@/utils/mobileUtils';

interface InteractivePopupProps {
  plaque: Plaque;
  onViewDetails: (plaque: Plaque) => void;
  onAddToRoute?: (plaque: Plaque) => void;
  onToggleFavorite?: (plaque: Plaque) => void;
  onMarkVisited?: (plaque: Plaque) => void;
  onAddToCollection?: (plaque: Plaque) => void;
  onShare?: (plaque: Plaque) => void;
  isFavorite?: boolean;
  isVisited?: boolean;
  isRoutingMode?: boolean;
  distance?: number;
  formatDistance?: (distance: number) => string;
  showDistance?: boolean;
}

export const InteractivePopup: React.FC<InteractivePopupProps> = ({
  plaque,
  onViewDetails,
  onAddToRoute,
  onToggleFavorite,
  onMarkVisited,
  onAddToCollection,
  onShare,
  isFavorite = false,
  isVisited = false,
  isRoutingMode = false,
  distance,
  formatDistance,
  showDistance = false,
}) => {
  const mobile = isMobile();

  const handleAction = (
    action: () => void,
    hapticType: 'light' | 'medium' | 'heavy' = 'light'
  ) => {
    if (mobile) {
      triggerHapticFeedback(hapticType);
    }
    action();
  };

  return (
    <div
      className="interactive-popup"
      style={{
        minWidth: mobile ? '280px' : '320px',
        maxWidth: mobile ? '90vw' : '380px',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header Section */}
      <div
        className="popup-header"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          padding: mobile ? '12px' : '16px',
          borderRadius: '8px 8px 0 0',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3
              style={{
                fontSize: mobile ? '14px' : '16px',
                fontWeight: '600',
                color: '#1f2937',
                lineHeight: '1.3',
                margin: '0 0 4px 0',
                wordBreak: 'break-word',
              }}
            >
              {plaque.title || 'Unnamed Plaque'}
            </h3>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                marginBottom: '6px',
              }}
            >
              <MapPin size={12} style={{ color: '#6b7280', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  lineHeight: '1.2',
                }}
              >
                {plaque.location || plaque.address || 'Location not specified'}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '4px',
                marginTop: '6px',
              }}
            >
              {plaque.profession && plaque.profession !== 'Unknown' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: '#ddd6fe',
                    color: '#6d28d9',
                    borderRadius: '10px',
                    fontWeight: '500',
                  }}
                >
                  <User size={8} />
                  {plaque.profession}
                </span>
              )}

              {plaque.color && plaque.color !== 'unknown' && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: '#bfdbfe',
                    color: '#1d4ed8',
                    borderRadius: '10px',
                    fontWeight: '500',
                  }}
                >
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getColorHex(plaque.color),
                    }}
                  />
                  {plaque.color.charAt(0).toUpperCase() + plaque.color.slice(1)}
                </span>
              )}

              {showDistance && distance && distance < Infinity && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '2px',
                    fontSize: '10px',
                    padding: '2px 6px',
                    backgroundColor: '#d1fae5',
                    color: '#065f46',
                    borderRadius: '10px',
                    fontWeight: '500',
                  }}
                >
                  📍{' '}
                  {formatDistance
                    ? formatDistance(distance)
                    : `${distance.toFixed(1)}km`}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              alignItems: 'flex-end',
            }}
          >
            {isVisited && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '10px',
                  color: '#059669',
                  fontWeight: '600',
                }}
              >
                <Clock size={10} />
                Visited
              </div>
            )}
            {isFavorite && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                  fontSize: '10px',
                  color: '#d97706',
                  fontWeight: '600',
                }}
              >
                <Heart size={10} fill="currentColor" />
                Favorite
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="popup-actions"
        style={{
          padding: mobile ? '12px' : '16px',
          background: 'white',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isRoutingMode ? '1fr 1fr' : '1fr',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          <button
            onClick={() => handleAction(() => onViewDetails(plaque), 'medium')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: mobile ? '10px 12px' : '12px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: mobile ? '13px' : '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minHeight: mobile ? '44px' : '40px',
            }}
          >
            <Eye size={mobile ? 16 : 14} />
            View Details
          </button>

          {isRoutingMode && onAddToRoute && (
            <button
              onClick={() => handleAction(() => onAddToRoute(plaque), 'medium')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: mobile ? '10px 12px' : '12px 16px',
                backgroundColor: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: mobile ? '13px' : '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: mobile ? '44px' : '40px',
              }}
            >
              <Plus size={mobile ? 16 : 14} />
              Add to Route
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: '6px',
          }}
        >
          {onToggleFavorite && (
            <button
              onClick={() =>
                handleAction(() => onToggleFavorite(plaque), 'light')
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: mobile ? '8px' : '8px 12px',
                backgroundColor: isFavorite ? '#fef3c7' : '#f9fafb',
                color: isFavorite ? '#d97706' : '#4b5563',
                border: `1px solid ${isFavorite ? '#f59e0b' : '#d1d5db'}`,
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: mobile ? '40px' : '36px',
              }}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart size={12} fill={isFavorite ? 'currentColor' : 'none'} />
              {!mobile && (isFavorite ? 'Unfav' : 'Fav')}
            </button>
          )}

          {onMarkVisited && !isVisited && (
            <button
              onClick={() => handleAction(() => onMarkVisited(plaque), 'light')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: mobile ? '8px' : '8px 12px',
                backgroundColor: '#f0fdf4',
                color: '#065f46',
                border: '1px solid #bbf7d0',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: mobile ? '40px' : '36px',
              }}
              title="Mark as visited"
            >
              <Clock size={12} />
              {!mobile && 'Visit'}
            </button>
          )}

          {onAddToCollection && (
            <button
              onClick={() =>
                handleAction(() => onAddToCollection(plaque), 'light')
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: mobile ? '8px' : '8px 12px',
                backgroundColor: '#f3e8ff',
                color: '#7c3aed',
                border: '1px solid #c4b5fd',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: mobile ? '40px' : '36px',
              }}
              title="Add to collection"
            >
              <Building size={12} />
              {!mobile && 'Collect'}
            </button>
          )}

          {onShare && (
            <button
              onClick={() => handleAction(() => onShare(plaque), 'light')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                padding: mobile ? '8px' : '8px 12px',
                backgroundColor: '#f8fafc',
                color: '#475569',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                minHeight: mobile ? '40px' : '36px',
              }}
              title="Share plaque"
            >
              <Share2 size={12} />
              {!mobile && 'Share'}
            </button>
          )}
        </div>
      </div>

      {plaque.inscription && (
        <div
          style={{
            padding: '12px 16px',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              color: '#64748b',
              lineHeight: '1.4',
              maxHeight: '60px',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {plaque.inscription.length > 120
              ? `${plaque.inscription.substring(0, 120)}...`
              : plaque.inscription}
          </div>

          <button
            onClick={() => handleAction(() => onViewDetails(plaque), 'light')}
            style={{
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '10px',
              color: '#3b82f6',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="m7 17 10-10M17 7H7v10" />
            </svg>
            Read full inscription
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function for color mapping
function getColorHex(color: string): string {
  const colorMap: Record<string, string> = {
    blue: '#3b82f6',
    green: '#10b981',
    brown: '#b45309',
    black: '#1f2937',
    grey: '#4b5563',
    gray: '#4b5563',
    red: '#ef4444',
    yellow: '#eab308',
    purple: '#8b5cf6',
  };

  return colorMap[color.toLowerCase()] || '#3b82f6';
}

// Factory function to create popup DOM element for Leaflet
export const createInteractivePopupElement = (
  props: InteractivePopupProps
): HTMLDivElement => {
  const container = document.createElement('div');
  const mobile = isMobile();

  const popupHTML = `
    <div class="interactive-popup-leaflet" style="
      min-width: ${mobile ? '280px' : '320px'};
      max-width: ${mobile ? '90vw' : '380px'};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      overflow: hidden;
    ">
      <div class="popup-header" style="
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        padding: ${mobile ? '12px' : '16px'};
        border-bottom: 1px solid #e2e8f0;
      ">
        <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
          <div style="flex: 1; min-width: 0;">
            <h3 style="
              font-size: ${mobile ? '14px' : '16px'};
              font-weight: 600;
              color: #1f2937;
              line-height: 1.3;
              margin: 0 0 4px 0;
              word-break: break-word;
            ">
              ${props.plaque.title || 'Unnamed Plaque'}
            </h3>
            
            <div style="display: flex; align-items: center; gap: 4px; margin-bottom: 6px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span style="font-size: 11px; color: #6b7280; line-height: 1.2;">
                ${props.plaque.location || props.plaque.address || 'Location not specified'}
              </span>
            </div>

            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px;">
              ${
                props.plaque.profession && props.plaque.profession !== 'Unknown'
                  ? `
                <span style="
                  display: inline-flex;
                  align-items: center;
                  gap: 2px;
                  font-size: 10px;
                  padding: 2px 6px;
                  background-color: #ddd6fe;
                  color: #6d28d9;
                  border-radius: 10px;
                  font-weight: 500;
                ">
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  ${props.plaque.profession}
                </span>
              `
                  : ''
              }
              
              ${
                props.plaque.color && props.plaque.color !== 'unknown'
                  ? `
                <span style="
                  display: inline-flex;
                  align-items: center;
                  gap: 2px;
                  font-size: 10px;
                  padding: 2px 6px;
                  background-color: #bfdbfe;
                  color: #1d4ed8;
                  border-radius: 10px;
                  font-weight: 500;
                ">
                  <div style="
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background-color: ${getColorHex(props.plaque.color)};
                  "></div>
                  ${props.plaque.color.charAt(0).toUpperCase() + props.plaque.color.slice(1)}
                </span>
              `
                  : ''
              }

              ${
                props.showDistance &&
                props.distance &&
                props.distance < Infinity
                  ? `
                <span style="
                  display: inline-flex;
                  align-items: center;
                  gap: 2px;
                  font-size: 10px;
                  padding: 2px 6px;
                  background-color: #d1fae5;
                  color: #065f46;
                  border-radius: 10px;
                  font-weight: 500;
                ">
                  📍 ${props.formatDistance ? props.formatDistance(props.distance) : `${props.distance.toFixed(1)}km`}
                </span>
              `
                  : ''
              }
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 2px; align-items: flex-end;">
            ${
              props.isVisited
                ? `
              <div style="
                display: flex;
                align-items: center;
                gap: 2px;
                font-size: 10px;
                color: #059669;
                font-weight: 600;
              ">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Visited
              </div>
            `
                : ''
            }
            ${
              props.isFavorite
                ? `
              <div style="
                display: flex;
                align-items: center;
                gap: 2px;
                font-size: 10px;
                color: #d97706;
                font-weight: 600;
              ">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Favorite
              </div>
            `
                : ''
            }
          </div>
        </div>
      </div>

      <div class="popup-actions" style="padding: ${mobile ? '12px' : '16px'}; background: white;">
        <div style="
          display: grid;
          grid-template-columns: ${props.isRoutingMode ? '1fr 1fr' : '1fr'};
          gap: 8px;
          margin-bottom: 8px;
        ">
          <button
            class="view-details-btn"
            style="
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
              padding: ${mobile ? '10px 12px' : '12px 16px'};
              background-color: #3b82f6;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: ${mobile ? '13px' : '14px'};
              font-weight: 600;
              cursor: pointer;
              transition: all 0.2s ease;
              min-height: ${mobile ? '44px' : '40px'};
            "
          >
            <svg width="${mobile ? '16' : '14'}" height="${mobile ? '16' : '14'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            View Details
          </button>

          ${
            props.isRoutingMode && props.onAddToRoute
              ? `
            <button
              class="add-to-route-btn"
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                padding: ${mobile ? '10px 12px' : '12px 16px'};
                background-color: #10b981;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: ${mobile ? '13px' : '14px'};
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: ${mobile ? '44px' : '40px'};
              "
            >
              <svg width="${mobile ? '16' : '14'}" height="${mobile ? '16' : '14'}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add to Route
            </button>
          `
              : ''
          }
        </div>

        <div style="
          display: grid;
          grid-template-columns: ${mobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)'};
          gap: 6px;
        ">
          ${
            props.onToggleFavorite
              ? `
            <button
              class="favorite-btn"
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                padding: ${mobile ? '8px' : '8px 12px'};
                background-color: ${props.isFavorite ? '#fef3c7' : '#f9fafb'};
                color: ${props.isFavorite ? '#d97706' : '#4b5563'};
                border: 1px solid ${props.isFavorite ? '#f59e0b' : '#d1d5db'};
                border-radius: 6px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: ${mobile ? '40px' : '36px'};
              "
              title="${props.isFavorite ? 'Remove from favorites' : 'Add to favorites'}"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="${props.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              ${!mobile ? (props.isFavorite ? 'Unfav' : 'Fav') : ''}
            </button>
          `
              : ''
          }

          ${
            props.onMarkVisited && !props.isVisited
              ? `
            <button
              class="visited-btn"
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                padding: ${mobile ? '8px' : '8px 12px'};
                background-color: #f0fdf4;
                color: #065f46;
                border: 1px solid #bbf7d0;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: ${mobile ? '40px' : '36px'};
              "
              title="Mark as visited"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${!mobile ? 'Visit' : ''}
            </button>
          `
              : ''
          }

          ${
            props.onAddToCollection
              ? `
            <button
              class="collection-btn"
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                padding: ${mobile ? '8px' : '8px 12px'};
                background-color: #f3e8ff;
                color: #7c3aed;
                border: 1px solid #c4b5fd;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: ${mobile ? '40px' : '36px'};
              "
              title="Add to collection"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21h18l-9-18-9 18zM12 9v4m0 4h.01"></path>
              </svg>
              ${!mobile ? 'Collect' : ''}
            </button>
          `
              : ''
          }

          ${
            props.onShare
              ? `
            <button
              class="share-btn"
              style="
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 4px;
                padding: ${mobile ? '8px' : '8px 12px'};
                background-color: #f8fafc;
                color: #475569;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                font-size: 11px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                min-height: ${mobile ? '40px' : '36px'};
              "
              title="Share plaque"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              ${!mobile ? 'Share' : ''}
            </button>
          `
              : ''
          }
        </div>
      </div>

      ${
        props.plaque.inscription
          ? `
        <div style="
          padding: 12px 16px;
          border-top: 1px solid #f1f5f9;
          background-color: #f8fafc;
        ">
          <div style="
            font-size: 11px;
            color: #64748b;
             line-height: 1.3;
             max-height: 60px;
           overflow: hidden;
           position: relative;
         ">
           ${
             props.plaque.inscription.length > 120
               ? `${props.plaque.inscription.substring(0, 120)}...`
               : props.plaque.inscription
           }
         </div>
         
         <button
           class="read-more-btn"
           style="
             margin-top: 6px;
             display: flex;
             align-items: center;
             gap: 4px;
             font-size: 10px;
             color: #3b82f6;
             background: none;
             border: none;
             cursor: pointer;
             font-weight: 500;
           "
         >
           <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="m7 17 10-10M17 7H7v10"/>
           </svg>
           Read full inscription
         </button>
       </div>
     `
          : ''
      }
   </div>
 `;

  container.innerHTML = popupHTML;

  // Add event listeners with proper error handling
  const addEventListeners = () => {
    // View Details button (always present)
    const viewDetailsBtn = container.querySelector(
      '.view-details-btn'
    ) as HTMLButtonElement;
    if (viewDetailsBtn) {
      viewDetailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mobile) triggerHapticFeedback('medium');

        // Add visual feedback
        viewDetailsBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          viewDetailsBtn.style.transform = 'scale(1)';
        }, 150);

        props.onViewDetails(props.plaque);
      });

      // Hover effects for desktop
      if (!mobile) {
        viewDetailsBtn.addEventListener('mouseenter', () => {
          viewDetailsBtn.style.backgroundColor = '#2563eb';
          viewDetailsBtn.style.transform = 'translateY(-1px)';
        });

        viewDetailsBtn.addEventListener('mouseleave', () => {
          viewDetailsBtn.style.backgroundColor = '#3b82f6';
          viewDetailsBtn.style.transform = 'translateY(0)';
        });
      }
    }

    // Add to Route button
    const addToRouteBtn = container.querySelector(
      '.add-to-route-btn'
    ) as HTMLButtonElement;
    if (addToRouteBtn && props.onAddToRoute) {
      addToRouteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mobile) triggerHapticFeedback('medium');

        // Visual feedback
        addToRouteBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          addToRouteBtn.style.transform = 'scale(1)';
        }, 150);

        props.onAddToRoute!(props.plaque);
      });

      if (!mobile) {
        addToRouteBtn.addEventListener('mouseenter', () => {
          addToRouteBtn.style.backgroundColor = '#059669';
          addToRouteBtn.style.transform = 'translateY(-1px)';
        });

        addToRouteBtn.addEventListener('mouseleave', () => {
          addToRouteBtn.style.backgroundColor = '#10b981';
          addToRouteBtn.style.transform = 'translateY(0)';
        });
      }
    }

    // Favorite button
    const favoriteBtn = container.querySelector(
      '.favorite-btn'
    ) as HTMLButtonElement;
    if (favoriteBtn && props.onToggleFavorite) {
      favoriteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mobile) triggerHapticFeedback('light');
        props.onToggleFavorite!(props.plaque);
      });
    }

    // Visited button
    const visitedBtn = container.querySelector(
      '.visited-btn'
    ) as HTMLButtonElement;
    if (visitedBtn && props.onMarkVisited) {
      visitedBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mobile) triggerHapticFeedback('light');
        props.onMarkVisited!(props.plaque);
      });
    }

    // Collection button
    const collectionBtn = container.querySelector(
      '.collection-btn'
    ) as HTMLButtonElement;
    if (collectionBtn && props.onAddToCollection) {
      collectionBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mobile) triggerHapticFeedback('light');
        props.onAddToCollection!(props.plaque);
      });
    }

    // Share button
    const shareBtn = container.querySelector('.share-btn') as HTMLButtonElement;
    if (shareBtn && props.onShare) {
      shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mobile) triggerHapticFeedback('light');
        props.onShare!(props.plaque);
      });
    }

    // Read more button
    const readMoreBtn = container.querySelector(
      '.read-more-btn'
    ) as HTMLButtonElement;
    if (readMoreBtn) {
      readMoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (mobile) triggerHapticFeedback('light');
        props.onViewDetails(props.plaque);
      });
    }
  };

  // Add event listeners after a short delay to ensure DOM is ready
  setTimeout(addEventListeners, 10);

  return container;
};

export default InteractivePopup;
