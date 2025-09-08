document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = 'http://localhost:3000/api';
    const token = localStorage.getItem('token');
    let currentUserId = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            currentUserId = payload.id;
        } catch (e) {
            console.error('Failed to decode token:', e);
            localStorage.removeItem('token');
            if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
                window.location.href = '/login.html';
            }
        }
    }

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

        async function saveProject() { /* ... existing saveProject logic ... */ }
        
        async function loadClients() {
            try {
                const response = await fetch(`${API_BASE_URL}/clients`, { headers: { 'Authorization': `Bearer ${token}` }});
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
                const response = await fetch(`${API_BASE_URL}/clients/${clientId}/project`, { headers: { 'Authorization': `Bearer ${token}` }});
                if (!response.ok) throw new Error('Project data not found.');
                currentProject = await response.json();
                currentClient = clients.find(c => c._id === clientId);
                renderFullProjectUI();
                initializeMessaging(clientId); // Load messages for the selected client
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
                if (index === 0) card.click();
            });
        }
        
        function renderFullProjectUI() {
            const template = document.getElementById('admin-panel-template');
            clientDetailView.innerHTML = ''; 
            clientDetailView.appendChild(template.content.cloneNode(true));
            initializeAdminPanelLogic();
        }
        
        function initializeAdminPanelLogic() { /* ... existing logic ... */ }
        function updateUIFromProjectData() { /* ... existing logic ... */ }
        function populateChecklistSection(phase, section) { /* ... existing logic ... */ }
        function updateProjectDataFromUI() { /* ... existing logic ... */ }
        function updateAllVisuals() { /* ... existing logic ... */ }
        function updatePhaseProgress(phaseId) { /* ... existing logic ... */ }
        function updateOverallProgress() { /* ... existing logic ... */ }

        // --- MESSAGING LOGIC FOR ADMIN ---
        function initializeMessaging(clientId) {
            const messageForm = document.getElementById('message-form');
            const messageInput = document.getElementById('message-input');
            const messageList = document.getElementById('message-list');
            if (!messageForm || !messageList || !messageInput) return;

            const loadMessages = async () => {
                const res = await fetch(`${API_BASE_URL}/messages/${clientId}`, { headers: { 'Authorization': `Bearer ${token}` }});
                const messages = await res.json();
                messageList.innerHTML = '';
                messages.forEach(renderMessage);
                messageList.scrollTop = messageList.scrollHeight;
            };

            const renderMessage = (msg) => {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'message';
                msgDiv.classList.add(msg.sender === currentUserId ? 'sent' : 'received');
                msgDiv.textContent = msg.content;
                messageList.appendChild(msgDiv);
            };

            messageForm.onsubmit = async (e) => {
                e.preventDefault();
                const content = messageInput.value.trim();
                if (!content) return;
                const res = await fetch(`${API_BASE_URL}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ receiverId: clientId, content })
                });
                if (res.ok) {
                    const newMessage = await res.json();
                    renderMessage(newMessage);
                    messageInput.value = '';
                    messageList.scrollTop = messageList.scrollHeight;
                }
            };
            
            loadMessages();
        }
        
        loadClients();
    }

    // --- CLIENT PORTAL LOGIC ---
    if (document.body.querySelector('#client-progress-grid')) {
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        // --- MESSAGING LOGIC FOR CLIENT ---
        const initializeClientMessaging = async () => {
            const messageForm = document.getElementById('message-form');
            const messageInput = document.getElementById('message-input');
            const messageList = document.getElementById('message-list');
            let adminId = null;

            if (!messageForm || !messageList || !messageInput) return;

            const renderMessage = (msg) => {
                const msgDiv = document.createElement('div');
                msgDiv.className = 'message';
                msgDiv.classList.add(msg.sender === currentUserId ? 'sent' : 'received');
                msgDiv.textContent = msg.content;
                messageList.appendChild(msgDiv);
            };

            const loadMessages = async () => {
                const res = await fetch(`${API_BASE_URL}/messages`, { headers: { 'Authorization': `Bearer ${token}` }});
                const data = await res.json();
                adminId = data.adminId;
                messageList.innerHTML = '';
                data.messages.forEach(renderMessage);
                messageList.scrollTop = messageList.scrollHeight;
            };

            messageForm.onsubmit = async (e) => {
                e.preventDefault();
                const content = messageInput.value.trim();
                if (!content || !adminId) return;
                const res = await fetch(`${API_BASE_URL}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ receiverId: adminId, content })
                });
                if (res.ok) {
                    const newMessage = await res.json();
                    renderMessage(newMessage);
                    messageInput.value = '';
                    messageList.scrollTop = messageList.scrollHeight;
                }
            };

            loadMessages();
        };

        initializeClientMessaging();
    }

    // --- LOGOUT LOGIC ---
    const logoutButton = document.querySelector('.logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        });
    }
});