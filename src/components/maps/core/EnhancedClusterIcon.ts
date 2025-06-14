// src/components/maps/core/EnhancedClusterIcon.ts
import L from 'leaflet';
import { Plaque } from '@/types/plaque';

interface ClusterPreviewOptions {
  maxTitles: number;
  showCategories: boolean;
  enableHover: boolean;
}

export class EnhancedClusterIcon {
  private static defaultOptions: ClusterPreviewOptions = {
    maxTitles: 5,
    showCategories: true,
    enableHover: true,
  };

  static createClusterIcon(
    cluster: L.MarkerClusterGroup,
    options: Partial<ClusterPreviewOptions> = {}
  ) {
    const opts = { ...this.defaultOptions, ...options };
    const count = cluster.getChildCount();

    let size = 36;
    let fontSize = '12px';

    if (count < 6) {
      size = 36;
      fontSize = '12px';
    } else if (count < 21) {
      size = 44;
      fontSize = '14px';
    } else if (count < 100) {
      size = 52;
      fontSize = '16px';
    } else {
      size = 60;
      fontSize = '18px';
    }

    const iconElement = L.divIcon({
      html: this.createClusterHTML(count, size, fontSize, opts.showCategories),
      className: 'enhanced-cluster-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    return iconElement;
  }

  private static createClusterHTML(
    count: number,
    size: number,
    fontSize: string,
    showCategories: boolean = true
  ): string {
    const displayCount = count > 999 ? '999+' : count.toString();

    return `
      <div class="cluster-container" style="position: relative;">
        <!-- Main cluster circle -->
        <div class="cluster-circle" style="
          width: ${size}px;
          height: ${size}px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: ${fontSize};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
          position: relative;
          z-index: 1;
        ">
          ${displayCount}
        </div>
        
        <!-- Pulse rings for large clusters -->
        ${
          count > 50 && showCategories
            ? `
          <div class="pulse-ring" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size + 8}px;
            height: ${size + 8}px;
            border: 2px solid rgba(59, 130, 246, 0.6);
            border-radius: 50%;
            animation: cluster-pulse 2s infinite;
            z-index: 0;
          "></div>
          <div class="pulse-ring-outer" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: ${size + 16}px;
            height: ${size + 16}px;
            border: 1px solid rgba(59, 130, 246, 0.4);
            border-radius: 50%;
            animation: cluster-pulse 2s infinite 0.5s;
            z-index: 0;
          "></div>
        `
            : ''
        }
      </div>
      
      <style>
        @keyframes cluster-pulse {
          0% {
            opacity: 0.8;
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            opacity: 0.4;
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(1.2);
          }
        }
        
        .cluster-circle:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
          background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        }
        
        .enhanced-cluster-icon:hover .cluster-preview {
          opacity: 1;
          visibility: visible;
          transform: translateY(-8px) scale(1);
        }
      </style>
    `;
  }

  static createClusterPreview(
    plaques: Plaque[],
    options: Partial<ClusterPreviewOptions> = {}
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    const totalCount = plaques.length;

    // For very large clusters (100+), show category summary instead of individual titles
    if (totalCount > 50) {
      return this.createCategorySummary(plaques);
    }

    // For medium clusters, show limited titles + "and X more"
    const displayPlaques = plaques.slice(0, opts.maxTitles);
    const remaining = Math.max(0, totalCount - opts.maxTitles);

    return `
      <div class="cluster-preview" style="
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-8px) scale(0.95);
        background: rgba(0, 0, 0, 0.9);
        backdrop-filter: blur(12px);
        color: white;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 12px;
        min-width: 200px;
        max-width: 280px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        pointer-events: none;
      ">
        <div style="font-weight: 600; margin-bottom: 6px; color: #60a5fa;">
          ${totalCount} Plaques in this area
        </div>
        
        <div style="space-y: 2px; max-height: 120px; overflow-y: auto;">
          ${displayPlaques
            .map(
              (plaque) => `
            <div style="
              font-size: 11px;
              line-height: 1.3;
              padding: 2px 0;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
              color: #e5e7eb;
            ">
              <div style="font-weight: 500; color: white;">
                ${this.truncateText(plaque.title || 'Unnamed Plaque', 35)}
              </div>
              ${
                plaque.profession
                  ? `
                <div style="font-size: 10px; color: #9ca3af; margin-top: 1px;">
                  ${this.truncateText(plaque.profession, 25)}
                </div>
              `
                  : ''
              }
            </div>
          `
            )
            .join('')}
          
          ${
            remaining > 0
              ? `
            <div style="
              font-size: 11px;
              color: #60a5fa;
              padding: 4px 0 2px 0;
              font-weight: 500;
            ">
              + ${remaining} more plaques
            </div>
          `
              : ''
          }
        </div>
        
        <div style="
          font-size: 10px;
          color: #9ca3af;
          margin-top: 6px;
          text-align: center;
          font-style: italic;
        ">
          Click to expand and explore
        </div>
        
        <!-- Arrow pointing down -->
        <div style="
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid rgba(0, 0, 0, 0.9);
        "></div>
      </div>
    `;
  }

  private static createCategorySummary(plaques: Plaque[]): string {
    const categories = this.analyzePlaqueCategories(plaques);
    const totalCount = plaques.length;

    return `
      <div class="cluster-preview large-cluster" style="
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%) translateY(-8px) scale(0.95);
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%);
        backdrop-filter: blur(16px);
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        font-size: 12px;
        min-width: 250px;
        max-width: 320px;
        box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.1);
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 1000;
        pointer-events: none;
      ">
        <div style="
          font-weight: 700;
          margin-bottom: 8px;
          color: #60a5fa;
          font-size: 14px;
          text-align: center;
        ">
          🏛️ ${totalCount} Plaques
        </div>
        
        <div style="margin-bottom: 8px;">
          <div style="font-size: 11px; color: #cbd5e1; margin-bottom: 4px; font-weight: 600;">
            Top Categories:
          </div>
          ${categories
            .slice(0, 4)
            .map(
              (cat) => `
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 2px 0;
              font-size: 11px;
            ">
              <span style="color: #e5e7eb;">
                ${this.truncateText(cat.name, 20)}
              </span>
              <span style="
                background: rgba(96, 165, 250, 0.2);
                color: #60a5fa;
                padding: 1px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 600;
              ">
                ${cat.count}
              </span>
            </div>
          `
            )
            .join('')}
        </div>
        
        ${
          categories.length > 4
            ? `
          <div style="
            font-size: 10px;
            color: #9ca3af;
            text-align: center;
            margin-top: 4px;
            font-style: italic;
          ">
            + ${categories.length - 4} more categories
          </div>
        `
            : ''
        }
        
        <div style="
          font-size: 10px;
          color: #60a5fa;
          text-align: center;
          margin-top: 8px;
          padding: 4px 8px;
          background: rgba(96, 165, 250, 0.1);
          border-radius: 6px;
          font-weight: 500;
        ">
          📍 Click to explore this area
        </div>
        
        <!-- Arrow pointing down -->
        <div style="
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 8px solid rgba(0, 0, 0, 0.95);
        "></div>
      </div>
    `;
  }

  private static analyzePlaqueCategories(
    plaques: Plaque[]
  ): Array<{ name: string; count: number }> {
    const categories: Record<string, number> = {};

    plaques.forEach((plaque) => {
      const category = plaque.profession || 'Other';
      categories[category] = (categories[category] || 0) + 1;
    });

    return Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }

  private static extractPlaquesFromCluster(
    cluster: L.MarkerClusterGroup
  ): Plaque[] {
    // This would need to be implemented based on how your cluster stores plaque data
    // For now, returning empty array as placeholder
    const markers = cluster.getAllChildMarkers?.() || [];
    return (
      markers
        .map((marker: any) => marker.options?.plaqueData)
        .filter(Boolean) || []
    );
  }

  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  // Enhanced cluster interaction setup
  static setupClusterInteractions(
    clusterGroup: L.MarkerClusterGroup,
    map: L.Map
  ) {
    clusterGroup.on('clustermouseover', (event: any) => {
      const clusterLayer = event.layer;
      const clusterElement = clusterLayer.getElement();

      if (clusterElement) {
        // Add hover preview if it doesn't exist
        if (!clusterElement.querySelector('.cluster-preview')) {
          // Extract plaques from the cluster
          const plaques = this.extractPlaquesFromCluster(clusterLayer);
          const previewHTML = this.createClusterPreview(plaques);
          clusterElement.insertAdjacentHTML('beforeend', previewHTML);
        }
      }
    });

    clusterGroup.on('clustermouseout', () => {
      // Preview hiding is handled by CSS transitions
    });

    // Enhanced click behavior with smooth zoom
    clusterGroup.on('clusterclick', (event: any) => {
      const clusterLayer = event.layer;
      const bounds = clusterLayer.getBounds();

      // Smooth zoom to cluster with padding
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 16,
        animate: true,
        duration: 0.8,
      });
    });
  }
}

// Export for use in useMarkers hook
export default EnhancedClusterIcon;
