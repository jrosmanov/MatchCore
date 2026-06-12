MatchCore — Gaming Platform

Oyunçu matchmaking platforması. Frontend HTML/CSS/JS, backend Python Flask + SQLite.

📁 Struktur

matchcore/
├── frontend/
│   ├── index.html        ← Bütün səhifələr (SPA)
│   ├── css/
│   │   └── main.css      ← Bütün stillər
│   └── js/
│       ├── shader.js     ← WebGL animasiya (home bg)
│       └── app.js        ← Routing, API, UI məntiqi
│
└── backend/
    ├── app.py            ← Flask REST API
    ├── requirements.txt
    └── matchcore.db      ← SQLite (avtomatik yaranır)

🚀 Quraşdırma

Backend

bashcd backend
pip install -r requirements.txt
python app.py
# API → http://localhost:5000/api

Frontend

bashcd frontend
# İstənilən statik server ilə aç:
python -m http.server 8080
# və ya sadəcə index.html-i brauzerə aç


Qeyd: Frontend backend olmadan da işləyir — mock data avtomatik aktivləşir.



🔗 API Endpointləri

MetodURLTəsvirGET/api/statsAna səhifə statistikalarıGET/api/playersOyunçu siyahısı (filter)POST/api/players/:id/likeOyunçunu bəyənPOST/api/players/:id/skipOyunçunu keçGET/api/eventsEvent siyahısıPOST/api/eventsYeni event yaratPOST/api/events/:id/joinEvente qoşulGET/api/profileProfil məlumatlarıPUT/api/profileProfili yeniləPOST/api/setupİlk quraşdırma

GET /api/players — Query Parametrləri

?game=Valorant&region=EUW&playstyle=Competitive&online=true

🎮 Səhifələr

SəhifəAçıqlamaHomeLanding, WebGL shader, statistikalarMatchesSwipe (like/skip), filter sidebarEventsTurnir kartları, event yaratProfileStatistika, oyunlar, nailiyyətlərSetup3 addımlı onboardingEdit ProfileProfil redaktəsi

🛠 Texnologiyalar

Frontend: Vanilla HTML · CSS (Glassmorphism) · Vanilla JS · WebGL

Backend: Python 3.10+ · Flask · SQLite

Fontlar: Sora · Inter · JetBrains Mono · Rajdhani

İkonlar: Material Symbols
