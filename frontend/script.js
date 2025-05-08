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

  let typingTimer;

  document.getElementById('msgInput').addEventListener('input', () => {
    clearTimeout(typingTimer);
    // envoie immédiatement le signal “typing”
    fetch(`${API}/typing`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ receiver: currentPeer })
    });
    // on arrête d'envoyer après 3s sans nouvelle saisie
    typingTimer = setTimeout(() => {}, 3000);
  });


  // Déconnexion
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    // Arrête le polling
    clearInterval(typingInterval);
    // Arrête le timeout de saisie
    clearTimeout(typingTimer);
    
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
        // Arrête le polling précédent si existant
        clearInterval(typingInterval);
        currentPeer = u;
        console.log('Selected peer =', currentPeer);
        document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        loadConversation();
        console.log('startTypingIndicatorPoll called for', currentPeer);
        startTypingIndicatorPoll();  // démarre le polling
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
  
    const list = document.getElementById('messagesList');
    list.innerHTML = '';
    msgs.forEach(m => {
      const div = document.createElement('div');
      div.classList.add('msg');
      const time = new Date(m.timestamp).toLocaleTimeString();
      div.innerHTML = `
        <div class="meta"><strong>${m.sender}</strong> <em>${time}</em></div>
        <div class="text">${m.message}</div>
      `;
      list.appendChild(div);
    });

    const container = document.getElementById('messages');
    container.scrollTop = container.scrollHeight;

  }
  
  let typingInterval;

  function startTypingIndicatorPoll() {
    clearInterval(typingInterval);
    console.log('startTypingIndicatorPoll, currentPeer =', currentPeer);

    const indicator = document.getElementById('typingIndicator');

    if (!indicator) {
      console.error('typingIndicator introuvable dans le DOM');
      return;
    }

    typingInterval = setInterval(async () => {
      console.log('polling /typing/' + currentPeer);
      const res = await fetch(`${API}/typing/${currentPeer}`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;

      const { typing } = await res.json();
      console.log('  peer typing?', typing);
      indicator.style.display = typing ? 'flex' : 'none';

       // Auto-scroll pour garder l’indicateur visible
      if (typing) {
        const container = document.getElementById('messages');
        container.scrollTop = container.scrollHeight;
      }
    }, 1000);
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

  // 1) Hook the button
document.getElementById('showStatsBtn').addEventListener('click', async () => {
  const panel = document.getElementById('statsPanel');
  // toggle visibility
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  if (panel.style.display === 'block') {
    await loadStats();
  }
});

// 2) Fetch and render stats
async function loadStats() {
  const res = await fetch(`${API}/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    console.error('Cannot load stats', res.status);
    return;
  }
  const { most_active_sender, most_requested_user } = await res.json();

  document.getElementById('mostActiveSender').innerText =
    most_active_sender.username;
  document.getElementById('messagesSent').innerText =
    most_active_sender.messages_sent;

  document.getElementById('mostRequestedUser').innerText =
    most_requested_user.username;
  document.getElementById('messagesReceived').innerText =
    most_requested_user.messages_received;
}


  // Initialisation + rafraîchissements
  fetchUsers();
  setInterval(fetchUsers, 5000);
  setInterval(() => { if (currentPeer) loadConversation(); }, 3000);
}
