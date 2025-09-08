document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('token');

    // --- AUTHENTICATION LOGIC ---
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorMessageDiv = document.getElementById('error-message');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (errorMessageDiv) errorMessageDiv.style.display = 'none';
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            try {
                const res = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password })
                });
                
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                
                alert('Registration successful! Please log in.');
                window.location.href = '/login.html';

            } catch (error) {
                 if(errorMessageDiv){
                    errorMessageDiv.textContent = error.message;
                    errorMessageDiv.style.display = 'block';
                 }
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(errorMessageDiv) errorMessageDiv.style.display = 'none';
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                
                localStorage.setItem('token', data.token);
                window.location.href = data.isAdmin ? '/admin.html' : '/client.html';

            } catch (error) {
                if(errorMessageDiv){
                    errorMessageDiv.textContent = error.message;
                    errorMessageDiv.style.display = 'block';
                }
            }
        });
    }

    // --- ADMIN PORTAL LOGIC ---
    if (document.body.querySelector('.content-area')) {
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        let clients = [];
        let currentProject = null;
        let currentClient = null;

        const clientListContainer = document.getElementById('client-list');
        const clientDetailView = document.getElementById('client-detail-view');

        async function saveProject() {
            if (!currentProject) return;
            try {
                await fetch(`${API_BASE_URL}/projects/${currentProject._id}`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify(currentProject)
                });
            } catch (error) {
                console.error('Failed to save project:', error);
            }
        }
        
        async function loadClients() {
            try {
                const response = await fetch(`${API_BASE_URL}/clients`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Could not fetch clients.');
                clients = await response.json();
                renderClientList();
            } catch (error) {
                console.error('Error loading clients:', error);
                clientListContainer.innerHTML = '<div class="empty-state">Could not load clients.</div>';
            }
        }
        
        async function loadProjectDetails(clientId) {
            try {
                clientDetailView.innerHTML = `<div class="empty-state">Loading project...</div>`;
                const response = await fetch(`${API_BASE_URL}/clients/${clientId}/project`, {
                     headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Project data not found. Try re-seeding the database.');
                currentProject = await response.json();
                currentClient = clients.find(c => c._id === clientId);
                renderFullProjectUI();
            } catch (error) {
                console.error('Error loading project details:', error);
                clientDetailView.innerHTML = `<div class="empty-state">Could not load project. ${error.message}</div>`;
            }
        }

        function renderClientList() {
             clientListContainer.innerHTML = '';
            if (!clients || clients.length === 0) {
                clientListContainer.innerHTML = '<div class="empty-state">No clients found.</div>';
                return;
            }
            clients.forEach((client, index) => {
                const card = document.createElement('div');
                card.className = 'client-card';
                card.dataset.clientId = client._id;
                card.innerHTML = `
                    <div class="client-name">${client.name}</div>
                    <span class="client-status status-${(client.status || 'inactive').toLowerCase().replace(/\s+/g, '-')}">${client.status}</span>
                    <div class="client-meta">Project: "${client.project ? client.project.name : 'N/A'}"</div>
                `;
                card.addEventListener('click', () => {
                    document.querySelectorAll('.client-card').forEach(c => c.classList.remove('active'));
                    card.classList.add('active');
                    loadProjectDetails(client._id);
                });
                clientListContainer.appendChild(card);
                if (index === 0) {
                    card.click();
                }
            });
        }
        
        function renderFullProjectUI() {
            const template = document.getElementById('admin-panel-template');
            clientDetailView.innerHTML = ''; 
            clientDetailView.appendChild(template.content.cloneNode(true));
            
            initializeAdminPanelLogic();
        }
        
        function initializeAdminPanelLogic() {
            updateUIFromProjectData();
            
            clientDetailView.addEventListener('change', (e) => {
                if (e.target.matches('.scope-checkbox, .progress-checkbox, .track-status-select, #scope-html, #scope-css, #scope-js')) {
                    updateProjectDataFromUI();
                    saveProject();
                    updateAllVisuals();
                }
            });

            clientDetailView.querySelector('#generate-tracks-btn')?.addEventListener('click', () => {
                const trackCount = parseInt(clientDetailView.querySelector('#track-count').value, 10);
                const newTracks = [];
                for (let i = 1; i <= trackCount; i++) {
                    newTracks.push({ trackNumber: i, inScope: true, status: 'not-started' });
                }
                currentProject.html.tracks = newTracks;
                saveProject();
                renderFullProjectUI();
            });
        }
        
        function updateUIFromProjectData() {
            document.getElementById('client-name-header').textContent = currentClient.name;
            document.getElementById('project-name-header').textContent = `Project: "${currentProject.name}"`;
            document.getElementById('scope-html').checked = currentProject.scope.html;
            document.getElementById('scope-css').checked = currentProject.scope.css;
            document.getElementById('scope-js').checked = currentProject.scope.js;

            Object.keys(currentProject.html).filter(key => key !== 'tracks').forEach(section => populateChecklistSection('html', section));
            Object.keys(currentProject.css).forEach(section => populateChecklistSection('css', section));
            Object.keys(currentProject.js).forEach(section => populateChecklistSection('js', section));

            document.getElementById('track-count').value = currentProject.html.tracks.length;
            const trackContainer = document.getElementById('track-status-container');
            trackContainer.innerHTML = '';
             currentProject.html.tracks.forEach((track, index) => {
                const div = document.createElement('div');
                div.className = 'track-status-item';
                div.innerHTML = `
                    <input type="checkbox" class="scope-checkbox" data-phase="html" data-section="tracks" data-index="${index}" ${track.inScope ? 'checked' : ''}>
                    <label>Track ${track.trackNumber}:</label>
                    <select class="track-status-select" data-phase="html" data-section="tracks" data-index="${index}">
                        <option value="not-started" ${track.status === 'not-started' ? 'selected' : ''}>Not Started</option>
                        <option value="in-progress" ${track.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
                        <option value="complete" ${track.status === 'complete' ? 'selected' : ''}>Complete</option>
                    </select>
                `;
                trackContainer.appendChild(div);
            });
            
            updateAllVisuals();
        }

        function populateChecklistSection(phase, section) {
            const sectionData = currentProject[phase][section];
            const container = clientDetailView.querySelector(`.checklist-section[data-section="${section}"]`);
            if (!container || !sectionData) return;

            sectionData.forEach((item, index) => {
                const div = document.createElement('div');
                div.className = 'checklist-item';
                div.innerHTML = `
                    <input type="checkbox" class="scope-checkbox" data-phase="${phase}" data-section="${section}" data-index="${index}" ${item.inScope ? 'checked' : ''}>
                    <input type="checkbox" class="progress-checkbox" data-phase="${phase}" data-section="${section}" data-index="${index}" ${item.isComplete ? 'checked' : ''}>
                    <label>${item.name}</label>
                `;
                container.appendChild(div);
            });
        }
        
        function updateProjectDataFromUI() {
            currentProject.scope.html = document.getElementById('scope-html').checked;
            currentProject.scope.css = document.getElementById('scope-css').checked;
            currentProject.scope.js = document.getElementById('scope-js').checked;

             document.querySelectorAll('.checklist-item .scope-checkbox').forEach(box => {
                const { phase, section, index } = box.dataset;
                if(currentProject[phase] && currentProject[phase][section] && currentProject[phase][section][index]){
                    currentProject[phase][section][index].inScope = box.checked;
                }
            });
            document.querySelectorAll('.checklist-item .progress-checkbox').forEach(box => {
                const { phase, section, index } = box.dataset;
                 if(currentProject[phase] && currentProject[phase][section] && currentProject[phase][section][index]){
                    currentProject[phase][section][index].isComplete = box.checked;
                }
            });
            
            document.querySelectorAll('.track-status-item .scope-checkbox').forEach((box, i) => {
                if(currentProject.html.tracks[i]) currentProject.html.tracks[i].inScope = box.checked;
            });
             document.querySelectorAll('.track-status-item .track-status-select').forEach((select, i) => {
                if(currentProject.html.tracks[i]) currentProject.html.tracks[i].status = select.value;
            });
        }
        
        function updateAllVisuals() {
            // Update Phase/Tab Visibility
            document.querySelectorAll('.phase-tab').forEach(tab => {
                tab.classList.toggle('scope-active', currentProject.scope[tab.dataset.phase]);
            });
            document.querySelectorAll('.phase-content').forEach(content => {
                content.classList.toggle('scope-active', currentProject.scope[content.id.replace('-content', '')]);
            });
             if (!document.querySelector('.phase-tab.active.scope-active')) {
                document.querySelector('.phase-tab.scope-active')?.classList.add('active');
            }
             if (!document.querySelector('.phase-content.active.scope-active')) {
                 document.querySelector('.phase-content.scope-active')?.classList.add('active');
            }
            
            // Update Item Visuals
            document.querySelectorAll('.checklist-item, .track-status-item').forEach(item => {
                const box = item.querySelector('.scope-checkbox');
                if(box) item.classList.toggle('scope-enabled', box.checked);
            });

            // Update Progress Bars
            updatePhaseProgress('html');
            updatePhaseProgress('css');
            updatePhaseProgress('js');
            updateOverallProgress();
        }
        
        function updatePhaseProgress(phaseId) {
            const content = document.getElementById(`${phaseId}-content`);
            if(!content) return;
            // ... progress calculation logic
        }

        function updateOverallProgress() {
            // ... overall progress calculation logic
        }
        
        loadClients();
    }

    // --- CLIENT PORTAL LOGIC ---
    if (document.body.querySelector('#client-progress-grid')) {
        if (!token) {
            window.location.href = '/login.html';
            return;
        }
    }
});

