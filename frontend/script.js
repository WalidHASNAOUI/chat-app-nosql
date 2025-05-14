const API = 'http://localhost:5000';
const tokenKey = 'chatToken';

// Redirect if not authenticated
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
  let typingInterval;

  // Broadcast button
  const broadcastBtn = document.getElementById('broadcastBtn');
  if (broadcastBtn) {
    broadcastBtn.addEventListener('click', async () => {
      const message = prompt('Entrez le message à diffuser :');
      if (!message) return;
      try {
        const res = await fetch(`${API}/broadcast`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ message })
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || 'Échec de la diffusion');
        alert(`Diffusé à ${body.broadcast_to} utilisateurs !`);
      } catch (err) {
        alert('Erreur : ' + err.message);
      }
    });
  }

  // Typing indicator (on input)
  const msgInput = document.getElementById('msgInput');
  if (msgInput) {
    msgInput.addEventListener('input', () => {
      clearTimeout(typingTimer);
      fetch(`${API}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type':'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ receiver: currentPeer })
      });
      typingTimer = setTimeout(() => {}, 3000);
    });
  }

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    clearInterval(typingInterval);
    clearTimeout(typingTimer);
    await fetch(`${API}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    localStorage.removeItem(tokenKey);
    localStorage.removeItem('me');
    window.location.href = 'login.html';
  });

  // Fetch connected users
  async function fetchUsers() {
    const res = await fetch(`${API}/connected-users`);
    const users = await res.json();
    const ul = document.getElementById('usersList');
    ul.innerHTML = '';
    users.filter(u => u !== me).forEach(u => {
      const li = document.createElement('li');
      li.textContent = u;
      li.onclick = () => {
        clearInterval(typingInterval);
        currentPeer = u;
        document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
        li.classList.add('active');
        loadConversation();
        startTypingIndicatorPoll();
      };
      ul.appendChild(li);
    });
  }

  // Send a message
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

  // Load conversation history
  async function loadConversation() {
    if (!currentPeer) return;
    const res = await fetch(`${API}/conversation/${currentPeer}`, {
      headers: { 
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (res.status === 401) {
      alert('Session expirée, reconnecte-toi.');
      localStorage.clear();
      return window.location.href = 'login.html';
    }
    const msgs = await res.json();
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

  // Poll for typing indicator
  function startTypingIndicatorPoll() {
    clearInterval(typingInterval);
    const indicator = document.getElementById('typingIndicator');
    typingInterval = setInterval(async () => {
      const res = await fetch(`${API}/typing/${currentPeer}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return;
      const { typing } = await res.json();
      indicator.style.display = typing ? 'flex' : 'none';
      if (typing) {
        const container = document.getElementById('messages');
        container.scrollTop = container.scrollHeight;
      }
    }, 1000);
  }

  // Message form handler
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

  // Stats button
  document.getElementById('showStatsBtn').addEventListener('click', async () => {
    const panel = document.getElementById('statsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    if (panel.style.display === 'block') {
      await loadStats();
    }
  });

  // Load stats
  async function loadStats() {
    const res = await fetch(`${API}/stats`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return console.error('Cannot load stats', res.status);
    const { most_active_sender, most_requested_user } = await res.json();
    document.getElementById('mostActiveSender').innerText = most_active_sender.username;
    document.getElementById('messagesSent').innerText = most_active_sender.messages_sent;
    document.getElementById('mostRequestedUser').innerText = most_requested_user.username;
    document.getElementById('messagesReceived').innerText = most_requested_user.messages_received;
  }

  // Initial load + polling
  fetchUsers();
  setInterval(fetchUsers, 5000);
  setInterval(() => { if (currentPeer) loadConversation(); }, 3000);
}
