/**
 * Lejio Fleet Widget
 * Embedbar widget til visning af flådedata på eksterne websites
 * 
 * Brug:
 * <div id="lejio-fleet-widget" data-api-key="flk_xxx"></div>
 * <script src="https://lejio.lovable.app/fleet-widget.js"></script>
 */
(function() {
  'use strict';

  const FLEET_API_URL = 'https://aqzggwewjttbkaqnbmrb.supabase.co/functions/v1/fleet-site';

  // Inject styles
  function injectStyles() {
    if (document.getElementById('lejio-fleet-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'lejio-fleet-styles';
    styles.textContent = `
      .lejio-widget {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
        max-width: 100%;
        background: #ffffff;
        border-radius: 12px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        overflow: hidden;
      }
      .lejio-widget * {
        box-sizing: border-box;
      }
      .lejio-widget-header {
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        color: white;
        padding: 24px;
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .lejio-widget-logo {
        width: 64px;
        height: 64px;
        border-radius: 12px;
        object-fit: cover;
        background: rgba(255,255,255,0.1);
      }
      .lejio-widget-company h2 {
        margin: 0 0 4px 0;
        font-size: 1.5rem;
        font-weight: 700;
      }
      .lejio-widget-company p {
        margin: 0;
        opacity: 0.8;
        font-size: 0.875rem;
      }
      .lejio-widget-tabs {
        display: flex;
        border-bottom: 1px solid #e5e7eb;
        background: #f9fafb;
      }
      .lejio-widget-tab {
        flex: 1;
        padding: 12px 16px;
        border: none;
        background: none;
        font-size: 0.875rem;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s;
        border-bottom: 2px solid transparent;
      }
      .lejio-widget-tab:hover {
        color: #111827;
        background: #f3f4f6;
      }
      .lejio-widget-tab.active {
        color: #2563eb;
        border-bottom-color: #2563eb;
        background: white;
      }
      .lejio-widget-content {
        padding: 16px;
        max-height: 500px;
        overflow-y: auto;
      }
      .lejio-widget-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 16px;
      }
      .lejio-vehicle-card {
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        overflow: hidden;
        transition: transform 0.2s, box-shadow 0.2s;
      }
      .lejio-vehicle-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      .lejio-vehicle-image {
        width: 100%;
        height: 160px;
        object-fit: cover;
        background: #f3f4f6;
      }
      .lejio-vehicle-info {
        padding: 12px;
      }
      .lejio-vehicle-title {
        margin: 0 0 4px 0;
        font-size: 1rem;
        font-weight: 600;
        color: #111827;
      }
      .lejio-vehicle-meta {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }
      .lejio-vehicle-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 8px;
        background: #f3f4f6;
        border-radius: 4px;
        font-size: 0.75rem;
        color: #4b5563;
      }
      .lejio-vehicle-price {
        font-size: 1.125rem;
        font-weight: 700;
        color: #2563eb;
      }
      .lejio-vehicle-price span {
        font-size: 0.75rem;
        font-weight: 400;
        color: #6b7280;
      }
      .lejio-service-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        transition: background 0.2s;
      }
      .lejio-service-card:hover {
        background: #f9fafb;
      }
      .lejio-service-info h4 {
        margin: 0 0 4px 0;
        font-size: 0.9375rem;
        font-weight: 600;
        color: #111827;
      }
      .lejio-service-info p {
        margin: 0;
        font-size: 0.8125rem;
        color: #6b7280;
      }
      .lejio-service-price {
        text-align: right;
      }
      .lejio-service-price strong {
        display: block;
        font-size: 1rem;
        color: #111827;
      }
      .lejio-service-price span {
        font-size: 0.75rem;
        color: #6b7280;
      }
      .lejio-widget-footer {
        padding: 12px 16px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        text-align: center;
      }
      .lejio-widget-footer a {
        color: #6b7280;
        text-decoration: none;
        font-size: 0.75rem;
      }
      .lejio-widget-footer a:hover {
        color: #2563eb;
      }
      .lejio-widget-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 48px;
        color: #6b7280;
      }
      .lejio-widget-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid #e5e7eb;
        border-top-color: #2563eb;
        border-radius: 50%;
        animation: lejio-spin 0.8s linear infinite;
        margin-bottom: 12px;
      }
      @keyframes lejio-spin {
        to { transform: rotate(360deg); }
      }
      .lejio-widget-error {
        padding: 32px;
        text-align: center;
        color: #dc2626;
      }
      .lejio-widget-empty {
        padding: 32px;
        text-align: center;
        color: #6b7280;
      }
      @media (max-width: 480px) {
        .lejio-widget-header {
          padding: 16px;
        }
        .lejio-widget-logo {
          width: 48px;
          height: 48px;
        }
        .lejio-widget-company h2 {
          font-size: 1.25rem;
        }
        .lejio-widget-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(styles);
  }

  // Format price
  function formatPrice(price) {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  // Render loading state
  function renderLoading(container) {
    container.innerHTML = `
      <div class="lejio-widget">
        <div class="lejio-widget-loading">
          <div class="lejio-widget-spinner"></div>
          <span>Indlæser flådedata...</span>
        </div>
      </div>
    `;
  }

  // Render error state
  function renderError(container, message) {
    container.innerHTML = `
      <div class="lejio-widget">
        <div class="lejio-widget-error">
          <p>⚠️ ${message}</p>
        </div>
      </div>
    `;
  }

  // Render vehicle card
  function renderVehicleCard(vehicle) {
    const imageUrl = vehicle.image_url || 'https://placehold.co/400x300/f3f4f6/9ca3af?text=Ingen+billede';
    return `
      <div class="lejio-vehicle-card">
        <img class="lejio-vehicle-image" src="${imageUrl}" alt="${vehicle.make} ${vehicle.model}" loading="lazy" onerror="this.src='https://placehold.co/400x300/f3f4f6/9ca3af?text=Ingen+billede'">
        <div class="lejio-vehicle-info">
          <h3 class="lejio-vehicle-title">${vehicle.make} ${vehicle.model}</h3>
          <div class="lejio-vehicle-meta">
            ${vehicle.year ? `<span class="lejio-vehicle-badge">${vehicle.year}</span>` : ''}
            ${vehicle.fuel_type ? `<span class="lejio-vehicle-badge">${vehicle.fuel_type}</span>` : ''}
            ${vehicle.vehicle_type ? `<span class="lejio-vehicle-badge">${vehicle.vehicle_type}</span>` : ''}
          </div>
          <div class="lejio-vehicle-price">
            ${formatPrice(vehicle.daily_price)} <span>/ dag</span>
          </div>
        </div>
      </div>
    `;
  }

  // Render service card
  function renderServiceCard(service) {
    return `
      <div class="lejio-service-card">
        <div class="lejio-service-info">
          <h4>${service.name}</h4>
          ${service.description ? `<p>${service.description}</p>` : ''}
        </div>
        <div class="lejio-service-price">
          <strong>${formatPrice(service.price)}</strong>
          ${service.estimated_minutes ? `<span>ca. ${service.estimated_minutes} min</span>` : ''}
        </div>
      </div>
    `;
  }

  // Render widget
  function renderWidget(container, data, options) {
    const { fleet_owner, vehicles, services } = data;
    const showVehicles = options.showVehicles !== false;
    const showServices = options.showServices !== false;
    
    const hasVehicles = vehicles && vehicles.length > 0;
    const hasServices = services && services.length > 0;
    
    let activeTab = showVehicles && hasVehicles ? 'vehicles' : (showServices && hasServices ? 'services' : null);
    
    function render() {
      container.innerHTML = `
        <div class="lejio-widget">
          <div class="lejio-widget-header">
            ${fleet_owner.logo_url 
              ? `<img class="lejio-widget-logo" src="${fleet_owner.logo_url}" alt="${fleet_owner.company_name || 'Logo'}">`
              : `<div class="lejio-widget-logo" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">🚗</div>`
            }
            <div class="lejio-widget-company">
              <h2>${fleet_owner.company_name || 'Udlejning'}</h2>
              ${fleet_owner.address ? `<p>📍 ${fleet_owner.address}</p>` : ''}
            </div>
          </div>
          
          ${(showVehicles && hasVehicles) || (showServices && hasServices) ? `
            <div class="lejio-widget-tabs">
              ${showVehicles && hasVehicles ? `<button class="lejio-widget-tab ${activeTab === 'vehicles' ? 'active' : ''}" data-tab="vehicles">🚗 Køretøjer (${vehicles.length})</button>` : ''}
              ${showServices && hasServices ? `<button class="lejio-widget-tab ${activeTab === 'services' ? 'active' : ''}" data-tab="services">🔧 Services (${services.length})</button>` : ''}
            </div>
          ` : ''}
          
          <div class="lejio-widget-content">
            ${activeTab === 'vehicles' && hasVehicles ? `
              <div class="lejio-widget-grid">
                ${vehicles.map(renderVehicleCard).join('')}
              </div>
            ` : ''}
            ${activeTab === 'services' && hasServices ? `
              <div class="lejio-widget-grid">
                ${services.map(renderServiceCard).join('')}
              </div>
            ` : ''}
            ${!activeTab ? `
              <div class="lejio-widget-empty">
                <p>Ingen data tilgængelig</p>
              </div>
            ` : ''}
          </div>
          
          <div class="lejio-widget-footer">
            <a href="https://lejio.lovable.app" target="_blank" rel="noopener">Powered by Lejio</a>
          </div>
        </div>
      `;
      
      // Add tab click handlers
      container.querySelectorAll('.lejio-widget-tab').forEach(tab => {
        tab.addEventListener('click', function() {
          activeTab = this.dataset.tab;
          render();
        });
      });
    }
    
    render();
  }

  // Initialize widget
  async function initWidget() {
    injectStyles();
    
    const container = document.getElementById('lejio-fleet-widget');
    if (!container) {
      console.error('Lejio Fleet Widget: Container #lejio-fleet-widget not found');
      return;
    }
    
    const apiKey = container.dataset.apiKey;
    if (!apiKey) {
      renderError(container, 'Mangler API-nøgle. Tilføj data-api-key attribut.');
      return;
    }
    
    const options = {
      showVehicles: container.dataset.showVehicles !== 'false',
      showServices: container.dataset.showServices !== 'false'
    };
    
    renderLoading(container);
    
    try {
      const response = await fetch(FLEET_API_URL, {
        method: 'GET',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!result.success) {
        renderError(container, result.error || 'Kunne ikke hente data');
        return;
      }
      
      renderWidget(container, result.data, options);
      
    } catch (error) {
      console.error('Lejio Fleet Widget error:', error);
      renderError(container, 'Netværksfejl. Prøv igen senere.');
    }
  }

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }

  // Expose for manual initialization
  window.LejioFleetWidget = { init: initWidget };
})();
