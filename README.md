MatchCore — Gaming Platform

Oyunçu matchmaking platforması. Frontend HTML/CSS/JS, backend Python Flask + SQLite.

📁 Struktur

Layihə strukturu belədir. matchcore qovluğunun içində iki əsas hissə var: frontend və backend. Frontend tərəfində index.html, css qovluğunda main.css, js qovluğunda isə app.js və shader.js faylları yerləşir. Backend tərəfində app.py əsas server faylıdır, requirements.txt isə lazım olan kitabxanaların siyahısını saxlayır. SQLite verilənlər bazası olan matchcore.db faylı isə server ilk dəfə işə salındıqda avtomatik yaranır.


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


GET /api/players — Query Parametrləri

?game=Valorant&region=EUW&playstyle=Competitive&online=true

🎮 Səhifələr

SəhifəAçıqlamaHomeLanding, WebGL shader, statistikalarMatchesSwipe (like/skip), filter sidebarEventsTurnir kartları, event yaratProfileStatistika, oyunlar, nailiyyətlərSetup3 addımlı onboardingEdit ProfileProfil redaktəsi

🛠 Texnologiyalar

Frontend: Vanilla HTML · CSS (Glassmorphism) · Vanilla JS · WebGL

Backend: Python 3.10+ · Flask · SQLite

Fontlar: Sora · Inter · JetBrains Mono · Rajdhani

İkonlar: Material Symbols
