const API = 'http://localhost:5000';
const tokenKey = 'chatToken';

// Redirection si non-authentifié
function ensureAuth() {
  if (!localStorage.getItem(tokenKey)) {
    window.location.href = 'login.html';
  }
}

// === LOGIN ===
if (document.getElementById('loginForm')) {
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      localStorage.setItem(tokenKey, data.token);
      localStorage.setItem('me', username);
      window.location.href = 'chat.html';
    } else {
      document.getElementById('loginError').innerText = data.error || 'Erreur';
    }
  });
}

// === REGISTER ===
if (document.getElementById('registerForm')) {
  document.getElementById('registerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = 'login.html';
    } else {
      document.getElementById('regError').innerText = data.error || 'Erreur';
    }
  });
}

// === CHAT PAGE ===
if (window.location.pathname.endsWith('chat.html')) {
  ensureAuth();
  const token = localStorage.getItem(tokenKey);
  const me = localStorage.getItem('me');
  document.getElementById('me').innerText = me;

  let currentPeer = null;

  // Déconnexion
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await fetch(`${API}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    localStorage.removeItem(tokenKey);
    localStorage.removeItem('me');
    window.location.href = 'login.html';
  });

  // Récupère la liste des utilisateurs connectés
  async function fetchUsers() {
    const res = await fetch(`${API}/connected-users`);
    const users = await res.json();
    const ul = document.getElementById('usersList');
    ul.innerHTML = '';
    users.filter(u => u !== me).forEach(u => {
      const li = document.createElement('li');
      li.textContent = u;
      li.onclick = () => {
        currentPeer = u;
        document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        loadConversation();
      };
      ul.appendChild(li);
    });
  }

  // Envoie un message
  async function sendMessage(text) {
    if (!currentPeer) return alert('Sélectionne un destinataire.');
    await fetch(`${API}/send`, {
      method: 'POST',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ receiver: currentPeer, message: text })
    });
  }

  // Charge la conversation avec le pair sélectionné
  async function loadConversation() {
    if (!currentPeer) return;
  
    const token = localStorage.getItem(tokenKey);
    const res = await fetch(`${API}/conversation/${currentPeer}`, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
  
    if (res.status === 401) {
      // token expiré ou invalide
      alert('Session expirée, reconnecte-toi.');
      localStorage.clear();
      window.location.href = 'login.html';
      return;
    }
    if (!res.ok) {
      console.error('Erreur HTTP inattendue', res.status);
      return;
    }
  
    const msgs = await res.json();
    if (!Array.isArray(msgs)) {
      console.error('Attendu un tableau de messages, reçu :', msgs);
      return;
    }
  
    const container = document.getElementById('messages');
    container.innerHTML = '';
    msgs.forEach(m => {
      const div = document.createElement('div');
      div.classList.add('msg');
      const time = new Date(m.timestamp).toLocaleTimeString();
      div.innerHTML = `
        <div class="meta"><strong>${m.sender}</strong> <em>${time}</em></div>
        <div class="text">${m.message}</div>
      `;
      container.appendChild(div);
    });
    container.scrollTop = container.scrollHeight;
  }
  
  

  // Gestion du formulaire d’envoi
  document.getElementById('msgForm').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('msgInput');
    const text = input.value.trim();
    if (!text) return;
    sendMessage(text).then(() => {
      input.value = '';
      loadConversation();
    });
  });

  // Initialisation + rafraîchissements
  fetchUsers();
  setInterval(fetchUsers, 5000);
  setInterval(() => { if (currentPeer) loadConversation(); }, 3000);
}
