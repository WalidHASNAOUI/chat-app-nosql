document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
    document.getElementById('userDisplay').innerText = username;
  
    const messageForm = document.getElementById('messageForm');
    const messagesDiv = document.getElementById('messages');
  
    messageForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const recipient = document.getElementById('recipient').value;
      const message = document.getElementById('message').value;
  
      await fetch('http://localhost:5000/send', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({sender: username, receiver: recipient, message})
      });
  
      document.getElementById('message').value = '';
      loadMessages();
    });
  
    async function loadMessages() {
      const res = await fetch(`http://localhost:5000/messages/${username}`);
      const data = await res.json();
      messagesDiv.innerHTML = '';
      data.forEach(msg => {
        const p = document.createElement('p');
        p.textContent = `${msg.sender} → ${msg.receiver}: ${msg.message}`;
        messagesDiv.appendChild(p);
      });
    }
  
    loadMessages();
    setInterval(loadMessages, 3000); // Refresh every 3 seconds
  });
  