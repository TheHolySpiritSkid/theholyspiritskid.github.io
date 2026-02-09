// Additional features for Arche v1.2
// Add this to the end of your main JavaScript in arche-streaming-full.html

// App version
const APP_VERSION = '1.2';

// Search functionality
let currentSearchTab = 'all';

function switchSearchTab(tab) {
    currentSearchTab = tab;
    
    // Update active tab
    document.querySelectorAll('.search-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // Re-run search if there's a query
    const query = document.getElementById('searchInput').value;
    if (query.length >= 2) {
        performSearch(query);
    }
}

async function performSearch(query) {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = '<div class="loading">Searching...</div>';
    
    let results = [];
    
    // Search movies/TV based on tab
    if (currentSearchTab === 'all' || currentSearchTab === 'movies' || currentSearchTab === 'tv') {
        const data = await searchMovies(query);
        if (data && data.results) {
            if (currentSearchTab === 'movies') {
                results = data.results.filter(item => item.media_type === 'movie');
            } else if (currentSearchTab === 'tv') {
                results = data.results.filter(item => item.media_type === 'tv');
            } else {
                results = data.results;
            }
        }
    }
    
    // Search profiles
    let profileResults = [];
    if (currentSearchTab === 'all' || currentSearchTab === 'profiles') {
        profileResults = searchProfiles(query);
    }
    
    // Display results
    resultsContainer.innerHTML = '';
    
    // Show profile results first if in profiles tab or all tab
    if (profileResults.length > 0) {
        profileResults.forEach(profile => {
            resultsContainer.appendChild(createProfileResult(profile));
        });
    }
    
    // Show movie/TV results
    if (results.length > 0) {
        results.filter(item => item.poster_path).slice(0, 20).forEach(item => {
            resultsContainer.appendChild(createMovieCard(item));
        });
    }
    
    if (profileResults.length === 0 && results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
    }
}

function searchProfiles(query) {
    const users = JSON.parse(localStorage.getItem('archeUsers')) || [];
    const lowerQuery = query.toLowerCase();
    
    return users.filter(user => {
        const name = (user.name || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        return name.includes(lowerQuery) || email.includes(lowerQuery);
    });
}

function createProfileResult(user) {
    const result = document.createElement('div');
    result.className = 'profile-result';
    
    const name = user.name || user.email.split('@')[0];
    const initial = name.charAt(0).toUpperCase();
    
    result.innerHTML = `
        <div class="profile-result-avatar">${initial}</div>
        <div class="profile-result-info">
            <div class="profile-result-name">${name}</div>
            <div class="profile-result-email">${user.email}</div>
        </div>
    `;
    
    result.onclick = () => {
        alert(`Profile: ${name}\nEmail: ${user.email}\nVerified: ${user.verified ? 'Yes' : 'No'}`);
    };
    
    return result;
}

// Update notification system
function checkForUpdates() {
    const lastVersion = localStorage.getItem('archeLastVersion');
    
    // Show update modal if this is a new version
    if (lastVersion !== APP_VERSION) {
        setTimeout(() => {
            showUpdateModal();
        }, 2000); // Show after 2 seconds
    }
}

async function showUpdateModal() {
    const modal = document.getElementById('updateModal');
    document.getElementById('updateVersion').textContent = APP_VERSION;
    
    // Load patch notes
    try {
        const response = await fetch('patch-notes.txt');
        const text = await response.text();
        
        const notesHTML = parsePatchNotes(text);
        document.getElementById('updateNotes').innerHTML = notesHTML;
    } catch (error) {
        console.error('Error loading patch notes:', error);
        document.getElementById('updateNotes').innerHTML = `
            <div class="update-section">
                <h3>✨ New Features</h3>
                <ul>
                    <li>Profile search functionality</li>
                    <li>Version update notifications</li>
                    <li>Enhanced movie details</li>
                </ul>
            </div>
        `;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function parsePatchNotes(text) {
    const lines = text.split('\n');
    let html = '';
    let currentSection = '';
    let currentList = [];
    
    const icons = {
        'New Features': '✨',
        'Bug Fixes': '🔧',
        'Improvements': '⚡',
        'Changes': '🔄'
    };
    
    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        
        if (line.startsWith('[') && line.endsWith(']')) {
            // Save previous section
            if (currentSection && currentList.length > 0) {
                const icon = icons[currentSection] || '📌';
                html += `<div class="update-section">`;
                html += `<h3>${icon} ${currentSection}</h3><ul>`;
                currentList.forEach(item => {
                    html += `<li>${item}</li>`;
                });
                html += '</ul></div>';
                currentList = [];
            }
            currentSection = line.slice(1, -1);
        } else if (line.startsWith('-') || line.startsWith('•')) {
            currentList.push(line.substring(1).trim());
        }
    }
    
    // Add last section
    if (currentSection && currentList.length > 0) {
        const icon = icons[currentSection] || '📌';
        html += `<div class="update-section">`;
        html += `<h3>${icon} ${currentSection}</h3><ul>`;
        currentList.forEach(item => {
            html += `<li>${item}</li>`;
        });
        html += '</ul></div>';
    }
    
    return html || '<p style="color: var(--purple-accent); text-align: center;">No patch notes available.</p>';
}

function closeUpdateModal() {
    document.getElementById('updateModal').classList.remove('active');
    document.body.style.overflow = 'auto';
    
    // Save that user has seen this version
    localStorage.setItem('archeLastVersion', APP_VERSION);
}

function goToDownloadPage() {
    window.location.href = 'download.html';
}

// Initialize update check when app loads
// Add this to your initializeApp function:
// checkForUpdates();
