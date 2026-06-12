<p align="center">
  <img src="https://img.shields.io/badge/MatchCore-v2.0-00D4FF?style=for-the-badge&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Flask-3.0-black?style=for-the-badge&logo=flask&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-embedded-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Frontend-Vanilla-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
</p>
<h1 align="center">⚡ MatchCore</h1>
<p align="center">Next-gen oyunçu matchmaking platforması — doğru oyunçunu, doğru vaxtda tap.</p>

📸 Səhifələr

SəhifəAçıqlamaHomeWebGL shader arxa plan, canlı statistikalar, CTAMatchesTinder-üslub swipe kartları, region / oyun / playstyle filtriEventsTurnir kartları, slot progress bar, event yaratProfileStatistika, nailiyyətlər, aktivlik tarixiSetup3 addımlı onboarding (platform → oyun → schedule)Edit ProfileAvatar, bio, Discord, gizlilik tənzimləməsi


🗂 Layihə Strukturu

matchcore/
│
├── frontend/
│   ├── index.html          # Bütün səhifələr — Single Page App
│   ├── css/
│   │   └── main.css        # Design system, komponentlər, responsive
│   └── js/
│       ├── shader.js       # WebGL GLSL animasiya (home bg)
│       └── app.js          # Router, API layer, bütün UI məntiqi
│
└── backend/
    ├── app.py              # Flask REST API + SQLite
    ├── requirements.txt    # flask, flask-cors
    └── matchcore.db        # Avtomatik yaranır (seed data ilə)


🚀 Quraşdırma

1. Backend-i işə sal

bashcd backend
pip install -r requirements.txt
python app.py

Server http://localhost:5000 adresinde başlayır. İlk işə salındıqda matchcore.db avtomatik yaranır və 10 test oyunçusu + 6 event ilə doldurulur.

2. Frontend-i aç

bashcd frontend
python -m http.server 8080
# → http://localhost:8080

Və ya sadəcə index.html faylını brauzerə aç.


💡 Qeyd: Backend olmadan da işləyir. Bağlantı olmadıqda frontend avtomatik olaraq mock data-ya keçir — heç bir xəta görünmür.




🔗 API Referansı

Statistika

GET /api/stats

json{ "players": "10", "events": 6, "avg_ping": 98 }


Oyunçular

GET /api/players

Query parametrləri:

ParametrTipNümunəgamestringValorantregionstringEUW, NA, KR, MENAplaystylestringCompetitive, Casual, Hardcoreonlinebooleantrue, false

Nümunə:

GET /api/players?region=EUW&playstyle=Competitive&online=true

POST /api/players/:id/like    # Swipe sağ
POST /api/players/:id/skip    # Swipe sol


Eventlər

GET  /api/events              # Siyahı (tag filteri: ?tag=TOURNAMENT)
POST /api/events              # Yeni event yarat
POST /api/events/:id/join     # Evente qoşul

POST /api/events — Body:

json{
  "title":       "Valorant 5v5 Cup",
  "game":        "Valorant",
  "date":        "2026-07-01",
  "time":        "20:00",
  "slots_total": 10,
  "region":      "EUW",
  "tag":         "TOURNAMENT",
  "prize":       "$500"
}

Event növləri: TOURNAMENT · CASUAL · RANKED · HARDCORE · CUSTOM


Profil

GET  /api/profile             # Cari profili al
PUT  /api/profile             # Profili yenilə
POST /api/setup               # Onboarding — ilk quraşdırma

PUT /api/profile — Body:

json{
  "username":  "Player_One",
  "email":     "player@matchcore.gg",
  "region":    "EUW",
  "playstyle": "Competitive",
  "discord":   "username#1234",
  "bio":       "Valorant main, EUW",
  "public":    true
}


🛠 Texnologiyalar

Frontend


Vanilla HTML5 / CSS3 / JavaScript — framework yoxdur
WebGL + GLSL (home shader animasiyası)
Dizayn: Glassmorphism, dark theme, CSS custom properties
Şriftlər: Sora · Inter · JetBrains Mono · Rajdhani
İkonlar: Material Symbols (Google)


Backend


Python 3.10+
Flask 3.0 + Flask-CORS
SQLite (WAL mode, foreign keys)
Seed data: 10 oyunçu, 6 event, 1 profil



⚙️ Mühit Dəyişənləri

DəyişənDefaultAçıqlamaMC_DBmatchcore.dbSQLite fayl yoluPORT5000Server portuDEBUGtrueFlask debug mode

bashMC_DB=/data/mc.db PORT=8000 DEBUG=false python app.py
