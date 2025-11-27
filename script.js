// Global DOM selectors
const NAV_LINKS = document.querySelectorAll('.nav-link');
const PAGE_CONTENTS = document.querySelectorAll('.page-content');
const HTML = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');

// Constants for localStorage keys
const GOOGLE_API_KEY = 'googleMapsApiKey';
const INITIAL_SETUP_FLAG = 'initialSetupComplete';

// Mapbox selectors (unused)
const mapboxInputContainer = document.getElementById('mapbox-input-container');
const mapContainer = document.getElementById('map-container'); 
const staticMapContainer = document.getElementById('static-map-container'); // Assumed ID for static map div


// --- DATA STRUCTURES (UNCHANGED) ---
const SAMPLE_STATS = { totalVehicles: 813, averageSpeed: 35, congestionLevel: 62, activeSignals: 12, };
const SAMPLE_LIGHTS = [
    { id: 'junc_A', name: 'Junction A: Central & Main', currentState: 'green', countdown: 25, timings: { red: 45, yellow: 5, green: 30 } },
    { id: 'junc_B', name: 'Junction B: Market Square', currentState: 'red', countdown: 35, timings: { red: 60, yellow: 5, green: 25 } },
    { id: 'junc_C', name: 'Junction C: West Side Entry', currentState: 'yellow', countdown: 4, timings: { red: 45, yellow: 5, green: 30 } },
    { id: 'junc_D', name: 'Junction D: Industrial Blvd', currentState: 'green', countdown: 10, timings: { red: 35, yellow: 5, green: 40 } },
];
let currentLights = [...SAMPLE_LIGHTS];
let lightInterval = null;
const HISTORICAL_DATA = [
    { hour: '00:00', vehicles: 150, congestion: 15, avgSpeed: 50 },
    { hour: '03:00', vehicles: 100, congestion: 10, avgSpeed: 55 },
    { hour: '06:00', vehicles: 350, congestion: 30, avgSpeed: 40 },
    { hour: '09:00', vehicles: 950, congestion: 80, avgSpeed: 15 }, 
    { hour: '12:00', vehicles: 600, congestion: 50, avgSpeed: 30 },
    { hour: '15:00', vehicles: 750, congestion: 65, avgSpeed: 25 },
    { hour: '18:00', vehicles: 1000, congestion: 90, avgSpeed: 10 }, 
    { hour: '21:00', vehicles: 400, congestion: 35, avgSpeed: 35 },
];
const WEEKLY_DATA = [
    { day: 'Mon', congestion: 75 },
    { day: 'Tue', congestion: 68 },
    { day: 'Wed', congestion: 72 },
    { day: 'Thu', congestion: 80 },
    { day: 'Fri', congestion: 85 },
    { day: 'Sat', congestion: 40 },
    { day: 'Sun', congestion: 35 },
];


// --- UTILITY FUNCTIONS (UNCHANGED) ---

function getCongestionClass(level) {
    if (level > 70) return { text: 'text-traffic-heavy', bg: 'bg-traffic-heavy' };
    if (level > 40) return { text: 'text-traffic-moderate', bg: 'bg-traffic-moderate' };
    return { text: 'text-traffic-light', bg: 'bg-traffic-light' };
}
function getTrafficColor(level) {
    switch (level) {
        case 'light': return 'hsl(var(--traffic-light))';
        case 'moderate': return 'hsl(var(--traffic-moderate))';
        case 'heavy': return 'hsl(var(--traffic-heavy))';
        default: return 'hsl(var(--muted))';
    }
}
function getLightClasses(state, type = 'text') {
    if (state === 'red') return type === 'text' ? 'text-traffic-heavy' : 'bg-traffic-heavy';
    if (state === 'yellow') return type === 'text' ? 'text-traffic-moderate' : 'bg-traffic-moderate';
    if (state === 'green') return type === 'text' ? 'text-traffic-light' : 'bg-traffic-light';
    return type === 'text' ? 'text-muted-foreground' : 'bg-muted-foreground/20';
}


// --- THEME/DARK MODE LOGIC (UNCHANGED) ---

function updateThemeIcon(isDark) {
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
}

function initializeTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let theme = localStorage.getItem('theme');
    let isDark = false;

    if (theme === 'dark' || (!theme && prefersDark)) {
        HTML.classList.add('dark');
        isDark = true;
    } else {
        HTML.classList.remove('dark');
        isDark = false;
    }
    updateThemeIcon(isDark);
}

window.toggleTheme = function() {
    const isDark = HTML.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
    
    // Re-render charts after theme change to pick up new computed colors
    renderCharts(); 
}


// --- ROUTING LOGIC (SIMPLIFIED) ---

function updateActiveLink(path) {
    NAV_LINKS.forEach(link => {
        const linkPath = link.getAttribute('data-path');
        if (linkPath === path) {
            link.classList.remove('text-muted-foreground', 'hover:bg-muted', 'hover:text-foreground');
            link.classList.add('bg-primary', 'text-primary-foreground', 'font-medium');
        } else {
            link.classList.remove('bg-primary', 'text-primary-foreground', 'font-medium');
            link.classList.add('text-muted-foreground', 'hover:bg-muted', 'hover:text-foreground');
        }
    });
}

function showStaticMap() {
    // Hide Mapbox containers
    if (mapboxInputContainer) mapboxInputContainer.classList.add('hidden');
    if (mapContainer) mapContainer.classList.add('hidden');
    
    // Show static image container
    if (staticMapContainer) {
        staticMapContainer.classList.remove('hidden');
        staticMapContainer.classList.add('flex');
    }
}

function renderPage(path) {
    PAGE_CONTENTS.forEach(page => page.style.display = 'none');

    const pageId = path === '/' ? 'page-dashboard' : `page-${path.substring(1)}`;
    const activePage = document.getElementById(pageId);
    
    if (activePage) {
        activePage.style.display = 'block';
    } else {
        document.getElementById('page-dashboard').style.display = 'block';
    }
    
    updateActiveLink(path);
    window.history.pushState({}, '', path);
    document.getElementById('content-wrapper').scrollTo(0, 0);

    // Always show the static map if on the dashboard route
    if (path === '/') {
        showStaticMap();
    }
}

function navigate(event) {
    event.preventDefault();
    const path = event.currentTarget.getAttribute('data-path');
    renderPage(path);
}


// --- DUMMY MAPBOX LOGIC REMOVAL ---
// All Mapbox API/token functions removed, replaced by showStaticMap()

// --- TRAFFIC STATS LOGIC (TrafficStats - UNCHANGED) ---

function renderTrafficStats(stats) {
    const { totalVehicles, averageSpeed, congestionLevel, activeSignals } = stats;
    const congestionClasses = getCongestionClass(congestionLevel);

    document.getElementById('stat-total-vehicles').textContent = totalVehicles.toLocaleString();
    document.getElementById('stat-avg-speed').textContent = `${averageSpeed} km/h`;
    document.getElementById('stat-active-signals').textContent = activeSignals;

    const congestionValueElement = document.getElementById('stat-congestion-value');
    congestionValueElement.textContent = `${congestionLevel}%`;
    congestionValueElement.className = `text-xl md:text-2xl font-bold ${congestionClasses.text}`;

    const congestionBarElement = document.getElementById('stat-congestion-bar');
    congestionBarElement.style.width = `${congestionLevel}%`;
    
    congestionBarElement.classList.remove('bg-traffic-heavy', 'bg-traffic-moderate', 'bg-traffic-light');
    congestionBarElement.classList.add(congestionClasses.bg);
}


// --- TRAFFIC LIGHT SIMULATION LOGIC (TrafficLightPanel - UNCHANGED) ---

const lightPanelContainer = document.getElementById('traffic-light-panel-container');

function renderTrafficLightPanel() {
    if (!lightPanelContainer) return;
    
    lightPanelContainer.innerHTML = currentLights.map(light => {
        const statusTextClass = getLightClasses(light.currentState, 'text');
        const statusBgClass = getLightClasses(light.currentState, 'bg');
        
        return `
            <div id="light-card-${light.id}" class="bg-card border border-border rounded-lg p-3 md:p-4 min-w-[240px] md:min-w-[280px] flex-shrink-0">
                <div class="flex items-center justify-between mb-3">
                    <h4 class="text-sm font-medium text-foreground">${light.name}</h4>
                    <span id="light-status-${light.id}" class="px-2 py-1 text-xs font-medium rounded ${statusBgClass}/20 ${statusTextClass}">
                        ${light.currentState.toUpperCase()}
                    </span>
                </div>

                <div class="flex items-center gap-4">
                    <div class="flex flex-col gap-2 p-3 bg-muted rounded-lg border border-border">
                        <div id="light-red-${light.id}" class="w-6 h-6 rounded-full transition-all ${light.currentState === 'red' ? 'bg-traffic-heavy' : 'bg-muted-foreground/20'}"></div>
                        <div id="light-yellow-${light.id}" class="w-6 h-6 rounded-full transition-all ${light.currentState === 'yellow' ? 'bg-traffic-moderate' : 'bg-muted-foreground/20'}"></div>
                        <div id="light-green-${light.id}" class="w-6 h-6 rounded-full transition-all ${light.currentState === 'green' ? 'bg-traffic-light' : 'bg-muted-foreground/20'}"></div>
                    </div>

                    <div class="flex-1">
                        <div id="light-countdown-${light.id}" class="text-2xl md:text-3xl font-bold text-foreground">${light.countdown}s</div>
                        <p class="text-xs text-muted-foreground mt-1">Until next change</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateLightDOM(light) {
    document.getElementById(`light-countdown-${light.id}`).textContent = `${light.countdown}s`;
    
    const statusEl = document.getElementById(`light-status-${light.id}`);
    const statusTextClass = getLightClasses(light.currentState, 'text');
    const statusBgClass = getLightClasses(light.currentState, 'bg');
    statusEl.textContent = light.currentState.toUpperCase();
    statusEl.className = `px-2 py-1 text-xs font-medium rounded ${statusBgClass}/20 ${statusTextClass}`;

    const redEl = document.getElementById(`light-red-${light.id}`);
    const yellowEl = document.getElementById(`light-yellow-${light.id}`);
    const greenEl = document.getElementById(`light-green-${light.id}`);
    
    redEl.className = `w-6 h-6 rounded-full transition-all ${light.currentState === 'red' ? 'bg-traffic-heavy' : 'bg-muted-foreground/20'}`;
    yellowEl.className = `w-6 h-6 rounded-full transition-all ${light.currentState === 'yellow' ? 'bg-traffic-moderate' : 'bg-muted-foreground/20'}`;
    greenEl.className = `w-6 h-6 rounded-full transition-all ${light.currentState === 'green' ? 'bg-traffic-light' : 'bg-muted-foreground/20'}`;
}

function runLightCycleStep() {
    currentLights = currentLights.map(light => {
        let newCountdown = light.countdown - 1;
        let newState = light.currentState;

        if (newCountdown <= 0) {
            switch (light.currentState) {
                case 'green':
                    newState = 'yellow';
                    newCountdown = light.timings.yellow;
                    break;
                case 'yellow':
                    newState = 'red';
                    newCountdown = light.timings.red;
                    break;
                case 'red':
                    newState = 'green';
                    newCountdown = light.timings.green;
                    break;
            }
        }
        const updatedLight = { ...light, currentState: newState, countdown: newCountdown };
        updateLightDOM(updatedLight);
        return updatedLight;
    });
}

function startLightSimulation() {
    if (lightInterval) clearInterval(lightInterval);
    renderTrafficLightPanel();
    lightInterval = setInterval(runLightCycleStep, 1000);
}


// --- CHART RENDERING LOGIC (TrafficCharts - UNCHANGED) ---

// Helper function to read theme colors accurately from the DOM
function getComputedChartColor(className) {
    const element = document.createElement('div');
    element.className = className;
    document.body.appendChild(element);
    const color = window.getComputedStyle(element).color;
    document.body.removeChild(element);
    return color;
}

function renderCharts() {
    // Colors based on your HSL variables (manually mapped to RGB/RGBA for Chart.js)
    const primaryColor = 'rgb(59, 130, 246)'; 
    const heavyColor = 'rgb(239, 68, 68)';   
    const lightColor = 'rgb(34, 197, 94)';   
    
    const computedForegroundColor = getComputedChartColor('text-foreground');
    const stableTickColor = '#ffffff'; 
    const stableGridColor = 'rgba(255, 255, 255, 0.15)'; 

    Chart.defaults.color = stableTickColor;

    const chartConfig = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
            legend: { display: false },
            tooltip: {
                backgroundColor: 'hsl(var(--card))',
                titleColor: computedForegroundColor,
                bodyColor: computedForegroundColor,
                borderColor: 'hsl(var(--border))',
                borderWidth: 1
            }
        },
        scales: {
            y: { 
                beginAtZero: true, 
                ticks: { color: stableTickColor, font: { size: 14 } }, 
                grid: { color: stableGridColor }
            },
            x: { 
                grid: { display: false },
                ticks: { color: stableTickColor, font: { size: 14 } } 
            }
        }
    };

    function createChart(id, type, data, options) {
        if (document.getElementById(id)) {
            new Chart(document.getElementById(id), { type, data, options });
        }
    }
    
    // 1. Vehicles Area Chart
    const vehiclesData = {
        labels: HISTORICAL_DATA.map(d => d.hour),
        datasets: [{
            label: 'Vehicles',
            data: HISTORICAL_DATA.map(d => d.vehicles),
            fill: 'start',
            backgroundColor: primaryColor + '4D', 
            borderColor: primaryColor,
            tension: 0.4
        }]
    };
    createChart('chart-area-vehicles', 'line', vehiclesData, chartConfig);
    createChart('chart-area-vehicles-analytics', 'line', vehiclesData, chartConfig);


    // 2. Congestion Line Chart
    const congestionLineData = {
        labels: HISTORICAL_DATA.map(d => d.hour),
        datasets: [{
            label: 'Congestion %',
            data: HISTORICAL_DATA.map(d => d.congestion),
            borderColor: heavyColor,
            tension: 0.2,
            pointRadius: 3
        }]
    };
    const congestionLineOptions = {
        ...chartConfig,
        scales: { ...chartConfig.scales, y: { ...chartConfig.scales.y, max: 100 } }
    };
    createChart('chart-line-congestion', 'line', congestionLineData, congestionLineOptions);
    createChart('chart-line-congestion-analytics', 'line', congestionLineData, congestionLineOptions);


    // 3. Weekly Congestion Bar Chart
    const weeklyBarData = {
        labels: WEEKLY_DATA.map(d => d.day),
        datasets: [{
            label: 'Congestion %',
            data: WEEKLY_DATA.map(d => d.congestion),
            backgroundColor: lightColor,
            borderRadius: 4
        }]
    };
    const weeklyBarOptions = {
        ...chartConfig,
        scales: { ...chartConfig.scales, y: { ...chartConfig.scales.y, max: 100 } }
    };
    createChart('chart-bar-weekly', 'bar', weeklyBarData, weeklyBarOptions);
}


// --- INITIALIZATION ---

function updateSystemTime() {
    document.getElementById('system-time').textContent = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

document.addEventListener('DOMContentLoaded', () => {
    
    NAV_LINKS.forEach(link => link.addEventListener('click', navigate));
    
    initializeTheme();
    setInterval(updateSystemTime, 1000);
    updateSystemTime();

    const setupComplete = localStorage.getItem(INITIAL_SETUP_FLAG);

    if (!setupComplete) {
        showSetupScreen();
    } else {
        renderTrafficStats(SAMPLE_STATS);
        startLightSimulation();
        renderCharts(); 
        
        // This renders the page and decides which map to show
        renderPage(window.location.pathname || '/');
        
        // Settings page prep (Mapbox key input is now redundant but kept for Settings UI logic)
        const storedGoogleApiKey = localStorage.getItem(GOOGLE_API_KEY);
        const apiKeyInput = document.getElementById('api-key-input');
        if (storedGoogleApiKey && apiKeyInput) {
            apiKeyInput.value = storedGoogleApiKey;
        }

        window.setActiveTab('analytics', 'patterns');
        window.setActiveTab('settings', 'api');
    }
});