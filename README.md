## 📝 Projet INFO834 – Application de Tchat (FastAPI + MongoDB + Redis)

### 📌 Description
Application de tchat temps réel entre utilisateurs avec gestion :
- des messages via **MongoDB** (avec ReplicaSet),
- des connexions via **Redis**,
- d'une **API REST** avec **FastAPI**,
- d'une interface cliente Python avec **sockets**.

---

### 🧱 Technologies
- **FastAPI** (API backend)
- **MongoDB** (stockage des messages)
- **PyMongo** (driver MongoDB)
- **Redis** (suivi des connexions)
- **redis-py** (client Python pour Redis)
- **Socket** (interface client/serveur)
- **Docker** (pour MongoDB ReplicaSet)

---

### 📁 Structure du projet
```bash
chat-app/
│
├── backend/                    # FastAPI backend
│   ├── main.py                 # Entrée principale de l’API
│   ├── db/                     # Connexion MongoDB et Redis
│   │   ├── mongodb.py
│   │   └── redisdb.py
│   ├── models/                 # Modèles Pydantic
│   │   ├── user.py
│   │   └── message.py
│   ├── routes/                 # Endpoints FastAPI
│   │   ├── users.py
│   │   └── messages.py
│   └── utils/                  # Fonctions utiles (requêtes avancées)
│       └── stats.py
│
├── client/                     # Interface utilisateur via socket
│   └── client.py
│
├── scripts/                    # Scripts pour init replica, setup etc.
│   ├── init_mongo_replica.sh
│   └── populate_db.py
│
├── tests/                      # Tests unitaires
│   ├── test_users.py
│   └── test_messages.py
│
├── Docker/                     # Docker config pour MongoDB ReplicaSet
│   └── docker-compose.yml
│
├── README.md
└── rapport.pdf                 # Rapport final avec captures et % contribution
```

---

### ✅ Fonctionnalités à implémenter

#### 🔹 Backend FastAPI (MongoDB)
- [ ] Créer/obtenir un utilisateur
- [ ] Envoyer un message à un autre utilisateur
- [ ] Récupérer historique des messages
- [ ] Obtenir les conversations entre deux utilisateurs
- [ ] Requêtes avancées :
  - Utilisateur le plus sollicité
  - Nombre de messages envoyés par utilisateur

#### 🔹 Redis (Connexions)
- [ ] Marquer un utilisateur comme connecté/déconnecté
- [ ] Stocker l’historique des connexions
- [ ] Récupérer les utilisateurs connectés en temps réel

#### 🔹 Interface Client
- [ ] Interface Python CLI en socket
- [ ] Commandes utilisateur :
  - `/connect`, `/send`, `/list`, `/history`, `/quit`

---

### 🧠 Répartition des tâches (proposition)

| Nom       | Tâches principales                          | Pourcentage |
|-----------|----------------------------------------------|-------------|
| Personne A | Backend FastAPI + modèles MongoDB           | 35%         |
| Personne B | Redis + statistiques/messages avancés       | 35%         |
| Personne C | Interface socket + tests + rapport final    | 30%         |

---

### 🧪 Tests
- [ ] API testée avec `pytest`
- [ ] Tests unitaires pour les routes MongoDB et Redis
- [ ] Démo live des 3 utilisateurs (minimum)

---

### 📸 Rapport final
- [ ] Captures d’écran des tests (MongoDB, Redis, API)
- [ ] Liste des routes API
- [ ] Pourcentages contribution
- [ ] Liens vers GitHub du projet

---
