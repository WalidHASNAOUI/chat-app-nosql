## 📝 Projet INFO834 – Application de Tchat (FastAPI + MongoDB + Redis)

### 🔧 **Objectif général**
Créer une application de **tchat web** :
- Backend en Python avec **MongoDB** (messages/conversations) et **Redis** (utilisateurs connectés).
- Interface web pour envoyer/lire des messages.
- Implémentation d’un **ReplicaSet MongoDB** pour tolérance aux pannes.

---

### 👥 Répartition du travail (proposition initiale)
| Membre | Rôle principal | 
|--------|----------------|
| Ayoub | Backend Python (API REST + MongoDB/Redis) | 
| Walid | Frontend Web (HTML/CSS/JS + intégration API) | 
| Ibtissam | Déploiement ReplicaSet + tests + rapport final | 

---

### 📁 Structure de projet

```bash
chat-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py               # Point d'entrée FastAPI
│   │   ├── models/               # Modèles MongoDB (schemas)
│   │   │   ├── __init__.py
│   │   │   └── message.py
│   │   │   └── user.py
│   │   ├── routes/               # Endpoints API
│   │   │   ├── __init__.py
│   │   │   ├── chat.py
│   │   │   └── user.py
│   │   ├── services/             # Logique métier
│   │   │   ├── __init__.py
│   │   │   ├── redis_service.py
│   │   │   └── mongo_service.py
│   │   └── config.py             # Connexion MongoDB/Redis
│
│   ├── requirements.txt          # Dépendances Python
│   └── tests/
│       ├── test_chat.py
│       └── test_user.py
│
├── frontend/
│   ├── static/                   # Fichiers CSS/JS
│   │   ├── style.css
│   │   └── script.js
│   ├── templates/                # HTML (via Jinja2 si Flask ou simple HTML)
│   │   ├── index.html
│   │   └── chat.html
│   └── README.md
│
├── docker/
│   ├── mongo/
│   │   └── mongo.conf            # Config ReplicaSet
│   └── docker-compose.yml       # Pour MongoDB + Redis + backend
│
├── .env                          # Variables d’environnement (host, ports, etc.)
├── README.md
└── rapport/
    └── MiniProjet_INFO834.pdf   # Rapport final
```

---

### 📅 Étapes du projet

#### **Étape 1 – Conception & Organisation**
- Choix de l’architecture (client-serveur REST).
- Répartition claire des tâches.
- Choix de la stack web : Flask (backend) + HTML/CSS/JS ou framework léger comme Bootstrap pour l’UI.
- Création d’un repo Git partagé.

---

#### **Étape 2 – Mise en place des bases de données**
**Responsables :Ayoub + Ibtissam**
- 📦 **MongoDB** :
  - Création des collections : `users`, `messages`, `conversations`.
  - Scripts de peuplement/test.
- ⚡ **Redis** :
  - Gestion des connexions utilisateur (ex : `SET user_id timestamp`, `EXPIRE`, etc.).

---

#### **Étape 3 – Développement backend Python (API REST)**
**Responsable : Ayoub**
- Connexion MongoDB avec **PyMongo**, Redis avec **redis-py**.
- Endpoints :
  - `POST /login` → Enregistrer l’utilisateur dans Redis.
  - `GET /users/online` → Afficher utilisateurs connectés.
  - `POST /message` → Envoyer un message (sauvegarde MongoDB).
  - `GET /conversation?user1=X&user2=Y` → Afficher historique.
  - `GET /stats/most_active_user` → Statistiques diverses.

---

#### **Étape 4 – Interface web**
**Responsable : Walid**
- Page d’accueil + formulaire de connexion.
- Affichage en temps réel (ou via rafraîchissement) des messages.
- Visualisation des utilisateurs connectés.
- Intégration avec API REST du backend.

---

#### **Étape 5 – Mise en place ReplicaSet MongoDB**
**Responsable : Ibtissam**
- Déploiement local avec 3 instances MongoDB (peut être simulé en local via ports différents).
- Tests de tolérance aux pannes (arrêt d’un nœud, vérification du failover).
- Screenshots et explications pour le rapport.

---

#### **Étape 6 – Tests unitaires et scénarios**
**Responsable : Ayoub + Ibtissam**
- Tests pour chaque endpoint de l’API.
- Cas d’usage :
  - Connexion multiple.
  - Conversation sauvegardée.
  - Crash d’un nœud MongoDB.
- Logs / messages d’erreur clairs.

---

#### **Étape 7 – Rapport final**
**Responsable : Walid + Ayoub + Ibtissam**
- Structure du rapport :
  1. Introduction & Contexte
  2. Architecture générale
  3. Description technique des fonctionnalités
  4. Code & screenshots des tests
  5. Statistiques de contribution
  6. Liens GitHub
- Format : PDF

---


