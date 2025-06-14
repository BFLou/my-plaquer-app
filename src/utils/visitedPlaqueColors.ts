import L from 'leaflet';
import { Plaque } from '../types/plaque'; // Adjusted to absolute path relative to src
// Import the new CSS file
import 'styles/enhanced-cluster-icon.css'; // Adjusted to absolute path relative to src

interface ClusterPreviewOptions {
  maxTitles: number;
  showCategories: boolean;
  enableHover: boolean;
}

// Extend Leaflet Marker interface to include your custom plaque data
declare module 'leaflet' {
  interface MarkerOptions {
    plaque?: Plaque; // Allows attaching a Plaque object directly to a marker's options
  }
}

export class EnhancedClusterIcon {
  private static defaultOptions: ClusterPreviewOptions = {
    maxTitles: 5,
    showCategories: true,
    enableHover: true,
  };

  /**
   * Creates a custom divIcon for a Leaflet marker cluster.
   * Includes dynamic sizing and optionally pre-renders a hidden preview for hover.
   * @param cluster The Leaflet cluster group.
   * @param options Customization options for the icon and preview.
   * @returns A Leaflet DivIcon instance.
   */
  static createClusterIcon(
    cluster: L.MarkerClusterGroup,
    options: Partial<ClusterPreviewOptions> = {}
  ) {
    const opts = { ...this.defaultOptions, ...options }; // Keep opts for internal logic
    const count = cluster.getChildCount();
    const plaques = this.extractPlaquesFromCluster(cluster); // Extract plaques here

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

    // Generate the cluster circle HTML
    const clusterCircleHTML = this.createClusterHTML(count, size, fontSize);

    // Generate the preview HTML (hidden by default, shown on hover via CSS)
    const previewHTML =
      opts.enableHover && plaques.length > 0
        ? this.createClusterPreview(plaques, opts)
        : '';

    // Combine into a single divIcon HTML structure
    const fullHtml = `
      <div class="cluster-container" style="position: relative;">
        ${clusterCircleHTML}
        ${previewHTML}
        <div class="cluster-preview-arrow"></div>
      </div>
    `;

    const iconElement = L.divIcon({
      html: fullHtml,
      className: 'enhanced-cluster-icon', // Main class for CSS targeting
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });

    return iconElement;
  }

  /**
   * Generates the HTML for the main cluster circle.
   * @param count Number of plaques in the cluster.
   * @param size Size of the icon in pixels.
   * @param fontSize Font size for the count.
   * @returns HTML string for the cluster circle.
   */
  private static createClusterHTML(
    count: number,
    size: number,
    fontSize: string
  ): string {
    const displayCount = count > 999 ? '999+' : count.toString();

    // Removed inline styles for cleaner CSS, now relies on enhanced-cluster-icon.css
    return `
      <div class="cluster-circle" style="
        width: ${size}px;
        height: ${size}px;
        font-size: ${fontSize};
      ">
        ${displayCount}
      </div>
      <!-- Pulse rings for large clusters, also controlled by CSS -->
      ${
        count > 50
          ? `
        <div class="pulse-ring" style="width: ${size + 8}px; height: ${size + 8}px;"></div>
        <div class="pulse-ring-outer" style="width: ${size + 16}px; height: ${size + 16}px;"></div>
      `
          : ''
      }
    `;
  }

  /**
   * Creates the HTML for the cluster hover preview (individual titles or category summary).
   * This is pre-rendered and shown/hidden via CSS on hover.
   * @param plaques The plaques within the cluster.
   * @param options Preview options (e.g., maxTitles, showCategories).
   * @returns HTML string for the preview.
   */
  static createClusterPreview(
    plaques: Plaque[],
    options: Partial<ClusterPreviewOptions> = {}
  ): string {
    const opts = { ...this.defaultOptions, ...options };
    const totalCount = plaques.length;

    // For very large clusters (50+), show category summary instead of individual titles
    if (totalCount > 50 && opts.showCategories) {
      return this.createCategorySummary(plaques);
    }

    // For medium clusters, show limited titles + "and X more"
    const displayPlaques = plaques.slice(0, opts.maxTitles);
    const remaining = Math.max(0, totalCount - opts.maxTitles);

    // Removed inline styles for cleaner CSS
    return `
      <div class="cluster-preview">
        <div class="preview-header">
          ${totalCount} Plaques in this area
        </div>

        <div style="max-height: 120px; overflow-y: auto;">
          ${displayPlaques
            .map(
              (plaque) => `
            <div class="preview-item">
              <div class="item-title">
                ${this.truncateText(plaque.title || 'Unnamed Plaque', 35)}
              </div>
              ${
                plaque.profession
                  ? `
                <div class="item-subtitle">
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
            <div class="more-plaques">
              + ${remaining} more plaques
            </div>
          `
              : ''
          }
        </div>

        <div class="click-to-explore">
          Click to expand and explore
        </div>
      </div>
    `;
  }

  /**
   * Creates the HTML for a category-based summary for large clusters.
   * @param plaques The plaques within the cluster.
   * @returns HTML string for the category summary preview.
   */
  private static createCategorySummary(plaques: Plaque[]): string {
    const categories = this.analyzePlaqueCategories(plaques);
    const totalCount = plaques.length;

    return `
      <div class="cluster-preview large-cluster">
        <div class="header-large">
          🏛️ ${totalCount} Plaques
        </div>

        <div style="margin-bottom: 8px;">
          <div class="category-header">
            Top Categories:
          </div>
          ${categories
            .slice(0, 4)
            .map(
              (cat) => `
            <div class="category-item">
              <span class="category-name">
                ${this.truncateText(cat.name, 20)}
              </span>
              <span class="category-count">
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
          <div class="more-categories">
            + ${categories.length - 4} more categories
          </div>
        `
            : ''
        }

        <div class="explore-prompt">
          📍 Click to explore this area
        </div>
      </div>
    `;
  }

  /**
   * Analyzes plaque professions to provide a category breakdown.
   * @param plaques Array of plaques.
   * @returns Sorted array of objects with category name and count.
   */
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

  /**
   * Extracts plaque data from a Leaflet marker cluster.
   * IMPORTANT: This implementation assumes your Leaflet markers have a `plaque` property in their `options`.
   * e.g., `L.marker(latlng, { plaque: myPlaqueData })`
   * @param cluster The Leaflet cluster group.
   * @returns An array of Plaque objects.
   */
  private static extractPlaquesFromCluster(
    cluster: L.MarkerClusterGroup
  ): Plaque[] {
    const childMarkers = cluster.getAllChildMarkers();
    return childMarkers
      .map(
        (marker) =>
          (marker.options as L.MarkerOptions & { plaque?: Plaque }).plaque
      ) // Safely cast to access plaque
      .filter((plaque): plaque is Plaque => !!plaque); // Filter out undefined/null and assert type
  }

  /**
   * Truncates text to a specified maximum length, adding ellipsis if truncated.
   * @param text The input string.
   * @param maxLength The maximum allowed length.
   * @returns The truncated string.
   */
  private static truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Sets up mouseover/mouseout for hover previews and enhanced click behavior for cluster groups.
   * @param clusterGroup The Leaflet marker cluster group.
   * @param map The Leaflet map instance.
   */
  static setupClusterInteractions(
    clusterGroup: L.MarkerClusterGroup,
    map: L.Map
  ) {
    // Note: The preview HTML is now included in the DivIcon itself and styled with CSS for hover.
    // We only need to handle the click event.

    clusterGroup.on('clusterclick', (event: any) => {
      const cluster = event.layer; // Direct access to cluster layer
      const bounds = cluster.getBounds();

      // Smooth zoom to cluster with padding
      map.fitBounds(bounds, {
        padding: [20, 20],
        maxZoom: 16,
        animate: true,
        duration: 0.8,
      });
    });

    // For hover interaction, you might want to add event listeners on the DivIcon itself
    // if you want to perform JS actions beyond CSS hover effects, but for simple hover
    // the CSS :hover is sufficient.
  }
}

// Export for use in useMarkers hook
export default EnhancedClusterIcon;
