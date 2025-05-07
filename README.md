# Chat App

A simple real-time chat application built with Flask (backend), MongoDB (ReplicaSet), Redis, and a vanilla HTML/CSS/JavaScript frontend. Users can register, authenticate using JWT, view online users, and exchange messages.

---

## Features

- **User Authentication**: JWT-based registration and login  
- **Real-time Online Status**: Tracks connected users in Redis  
- **Persistent Chat History**: Stores messages in MongoDB replica set  
- **RESTful API**: Clean separation between frontend and backend  
- **Vanilla JavaScript Frontend**: No frameworks, easy to customize  

---

## Prerequisites

- **Python 3.8+**  
- **MongoDB 6.x** (with `mongosh` client)  
- **Redis 6.x or 7.x**  
- **Node.js & npm** (optional, if you want to install a live-server)  

---

## Project Structure


```plaintext
chat-app/
├── backend/
│   ├── app.py            # Flask application
│   ├── config.py         # Configuration variables (optional)
│   └── requirements.txt  # Python dependencies
├── frontend/
│   ├── index.html        # Redirect to login
│   ├── login.html        # Login page
│   ├── register.html     # Registration page
│   ├── chat.html         # Chat interface
│   ├── style.css         # Stylesheet
│   └── script.js         # JavaScript logic
└── README.md             # This file
```

---

## Environment Variables

| Variable     | Description                       | Default             |
|--------------|-----------------------------------|---------------------|
| `JWT_SECRET` | Secret key for signing JWT tokens | `dev-secret-key`    |

Export in your shell before running the backend:

```bash
export JWT_SECRET="your-strong-secret"
```

---

## Backend Setup

1. Navigate to the backend folder
   ```bash
   cd chat-app/backend
   ```

2. (Recommandé) Créez et activez un environnement virtuel Python
    ```bash
    python3 -m venv venv
    source venv/bin/activate   
    ```
3. Installez les dépendances
   
    ```bash
    pip install -r requirements.txt
    ```

4. Démarrez MongoDB en mode ReplicaSet
    
    ```bash
    mkdir -p ~/data/mongo
    sudo rm /tmp/mongodb-27017.sock         # remove stale socket if present
    sudo chmod 1777 /tmp                    # ensure /tmp has correct permissions
    mongod --dbpath ~/data/mongo --port 27017 --replSet rs0
    ```

5. Initialisez le ReplicaSet / Verifiez son status
 
    ```bash
    mongosh --eval "rs.initiate()"
    mongosh --eval "rs.status()"
    ```

6. Démarrez Redis
    ```bash 
    redis-server
    ```

7. Exportez la variable d’environnement pour JWT
    ```bash
    export JWT_SECRET="your-strong-secret"
    ```

8. Lancez l’application Flask
    ```bash
    python app.py
    ```

---

## Frontend Setup

1. Navigate to the frontend folder
    ```bash 
    cd chat-app/frontend
    ```

2. Serve static files

- Option A: Python HTTP server : 
    ```bash 
    python3 -m http.server 8000
    ```
- Option B: Live Server (npm) : 
    ```bash 
    npm install -g live-server
    live-server --port=8000
    ```

3. Open the app in you browser 
    ```bash
    http://localhost:8000/login.html
    ```
---

## Usage

1. `Register` a new user on the registration page (register.html).
2. `Login` to obtain a JWT token (login.html).
3. `Chat:` select an online user from the sidebar and start exchanging messages (chat.html).
4. `Logout` by clicking the “Se déconnecter” button to clear your session.

---

## Troubleshooting

- ReplicaSet errors:

    - Ensure mongod is running with --replSet rs0.

    - Verify with:
        ```bash
        mongosh --eval "rs.status()"
        ```

- CORS issues:

    - Make sure Flask-CORS is configured to allow the Authorization header.

    - In `app.py`:
        ```bash
        CORS(app, resources={r"/*": {"origins": "*"}}, allow_headers=["Content-Type","Authorization"])
        ```

- Expired tokens:

    - Tokens expire after 1 hour by default.

    - Clear localStorage and re-login if you get 401 errors:
        ```bash
        localStorage.clear();
        window.location.href = 'login.html';
        ```
---

## License 
This project is licensed under the MIT License. Feel free to customize and extend it for your own use.
