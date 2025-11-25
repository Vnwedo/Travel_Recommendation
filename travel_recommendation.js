// Get references to the HTML elements
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resetButton = document.getElementById('resetButton');
const resultsContainer = document.getElementById('recommendationResults');

// Global variable to store the fetched travel data
let travelData = null;

// Timezone mapping for the cities in the JSON data (necessary for Task 10)
const timezoneMap = {
    'Sydney, Australia': 'Australia/Sydney',
    'Melbourne, Australia': 'Australia/Melbourne',
    'Tokyo, Japan': 'Asia/Tokyo',
    'Kyoto, Japan': 'Asia/Tokyo', // Assuming Kyoto uses the same time zone as Tokyo
    'Rio de Janeiro, Brazil': 'America/Sao_Paulo',
    'São Paulo, Brazil': 'America/Sao_Paulo'
};


/**
 * Retrieves the current time and date for a given time zone (Task 10).
 * @param {string} timezone - The IANA timezone string (e.g., 'America/New_York').
 * @returns {string} The formatted date and time string, or an empty string if timezone is unknown.
 */
function getCurrentTime(timezone) {
    if (!timezone) return '';

    try {
        const dateOptions = { 
            timeZone: timezone, 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: 'numeric', 
            minute: 'numeric', 
            second: 'numeric', 
            hour12: true 
        };
        // This is the core functionality requested in Task 10
        return new Date().toLocaleTimeString('en-US', dateOptions);
    } catch (e) {
        console.error("Invalid timezone:", timezone, e);
        return '';
    }
}


/**
 * Normalizes the search input to handle variations (plural, case) for matching (Task 7).
 * @param {string} term - The raw search input.
 * @returns {string} The normalized search term ('beaches', 'temples', 'countries', or the lowercased term).
 */
function normalizeInput(term) {
    const lowerTerm = term.toLowerCase().trim();
    
    // Check for common keyword variations
    if (lowerTerm.includes('beach')) return 'beaches';
    if (lowerTerm.includes('temple')) return 'temples';
    if (lowerTerm.includes('country')) return 'countries'; 
    
    // Fallback for specific country name search
    return lowerTerm;
}

/**
 * Renders the given array of recommendations onto the page in a structured card layout (Task 8).
 * @param {Array<Object>} results - Array of recommendation objects (cities, temples, or beaches).
 * @param {string} category - The category being displayed ('countries', 'temples', 'beaches').
 */
function displayRecommendations(results, category) {
    resultsContainer.innerHTML = ''; // Clear previous results

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #555; font-size: 1.1em; margin-top: 30px;">
                Sorry, no recommendations found for your search. Try searching for 'beach', 'temple', or a country name (e.g., 'Japan').
            </div>
        `;
        return;
    }

    // Apply grid styling for a responsive, clean layout
    resultsContainer.style.display = 'grid'; 
    resultsContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
    resultsContainer.style.gap = '30px';
    resultsContainer.style.marginTop = '40px';

    results.forEach(item => {
        // Placeholder image handling if URLs are not provided in JSON
        const imageUrl = item.imageUrl && !item.imageUrl.includes('enter_your_image')
            ? item.imageUrl 
            : 'https://placehold.co/400x250/A0B9E8/333333?text=Travel+Destination';

        // Task 10: Determine and display current time only for country results (cities)
        const isCityResult = category === 'countries';
        let timeDisplay = '';
        if (isCityResult) {
            const timezone = timezoneMap[item.name];
            const currentTime = getCurrentTime(timezone);
            if (currentTime) {
                timeDisplay = `<p style="font-size: 0.9em; font-weight: bold; color: #ff5722; margin-top: 10px;">Current Time: ${currentTime}</p>`;
            }
        }


        const itemHtml = `
            <div class="recommendation-card" style="
                border: 1px solid #e0e0e0;
                border-radius: 12px;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                background-color: #ffffff;
                transition: transform 0.3s;
            " onmouseover="this.style.transform='translateY(-8px)'" onmouseout="this.style.transform='translateY(0)'">
                
                <!-- Image Display -->
                <img src="${imageUrl}" 
                     alt="${item.name}" 
                     style="width: 100%; height: 200px; object-fit: cover;"
                     onerror="this.onerror=null; this.src='https://placehold.co/400x250/F0F0F0/888888?text=No+Image';">
                
                <!-- Content -->
                <div style="padding: 20px;">
                    <h3 style="margin-top: 0; color: #007bff; font-weight: 700; font-size: 1.5em;">${item.name}</h3>
                    ${timeDisplay}
                    <p style="color: #666; font-size: 1em; line-height: 1.4;">${item.description}</p>
                    <a href="#" style="display: block; text-align: right; color: #ff5722; text-decoration: none; font-weight: 600; margin-top: 15px;">Book This Trip →</a>
                </div>
            </div>
        `;
        resultsContainer.innerHTML += itemHtml;
    });
}

/**
 * Executes the search logic: retrieves input, normalizes it, filters data, and displays results (Tasks 7 & 8).
 */
async function performSearch() {
    // 1. Ensure data is loaded
    if (!travelData) {
        console.log('Attempting to load data...');
        travelData = await fetchRecommendations();
        if (!travelData) return; // Exit if data still failed to load
    }

    const rawTerm = searchInput.value;
    const normalizedTerm = normalizeInput(rawTerm);
    let results = [];
    let category = '';

    console.log(`Searching for: ${rawTerm} (Normalized: ${normalizedTerm})`);

    // 2. Search logic based on normalized term

    // Case 1: Search by 'beaches' or 'temples'
    if (normalizedTerm === 'beaches' || normalizedTerm === 'temples') {
        results = travelData[normalizedTerm] || [];
        category = normalizedTerm;
    } 
    // Case 2: Search by specific country name or if 'countries' was the normalized term
    else if (normalizedTerm === 'countries' || rawTerm.trim() !== '') {
        const countryTerm = rawTerm.toLowerCase().trim();
        category = 'countries';

        const matchingCountries = travelData.countries.filter(country => 
            // Match against country name OR if the user just typed 'countries'
            country.name.toLowerCase().includes(countryTerm) || normalizedTerm === 'countries'
        );

        // Collect all cities from matching countries
        matchingCountries.forEach(country => {
            country.cities.forEach(city => {
                results.push({
                    name: city.name,
                    imageUrl: city.imageUrl,
                    description: city.description
                });
            });
        });
    }

    // 3. Display the final results
    displayRecommendations(results, category);
}


/**
 * Fetches the travel recommendation data from the JSON file (Task 6).
 * @returns {Promise<Object|null>} The parsed JSON data or null if an error occurred.
 */
async function fetchRecommendations() {
    try {
        const response = await fetch('travel_recommendation_api.json');

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}. Check if 'travel_recommendation_api.json' exists.`);
        }

        const data = await response.json();
        console.log('✅ Successfully fetched travel recommendation data:', data);
        
        // Store data globally for search function to use
        travelData = data; 
        return data;

    } catch (error) {
        console.error('❌ Error fetching data:', error);
        // Display an error message if data loading fails
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="color: red; padding: 20px; text-align: center; background: #ffebeb; border-radius: 8px; margin-top: 30px;">
                    <p>Could not load travel data. Please ensure 'travel_recommendation_api.json' is correctly placed and accessible.</p>
                    <p>Details: ${error.message}</p>
                </div>
            `;
        }
        return null;
    }
}

// Wait for the entire HTML document to be loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
    // Initial data fetch upon page load
    fetchRecommendations();
    
    // Add event listeners for the buttons
    if (searchButton) {
        // Search executes ONLY on Search button click (Task 7)
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch(); 
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', (e) => {
            e.preventDefault();
            // Logic for Clear/Reset button (Task 9)
            searchInput.value = ''; // Clear input field
            resultsContainer.innerHTML = ''; // Clear results area
            console.log('Reset button clicked and results cleared.');
            
            // Revert results container styling
            resultsContainer.style.display = 'block';
            resultsContainer.style.marginTop = '0';
        });
    }
});