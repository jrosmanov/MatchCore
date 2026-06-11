"""
MatchCore Backend — app.py
Flask REST API with SQLite database.

Endpoints:
  GET  /api/stats
  GET  /api/players
  POST /api/players/:id/like
  POST /api/players/:id/skip
  GET  /api/events
  POST /api/events
  POST /api/events/:id/join
  GET  /api/profile
  PUT  /api/profile
  POST /api/setup

Run:
  pip install flask flask-cors
  python app.py
"""

from __future__ import annotations

import os
import random
import sqlite3
from contextlib import contextmanager
from datetime import datetime, date
from functools import wraps

from flask import Flask, g, jsonify, request
from flask_cors import CORS

# ── Config ───────────────────────────────────────────────────
DB_PATH  = os.environ.get("MC_DB", "matchcore.db")
PORT     = int(os.environ.get("PORT", 5000))
DEBUG    = os.environ.get("DEBUG", "true").lower() == "true"

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


# ══════════════════════════════════════════════════════════════
#  DATABASE
# ══════════════════════════════════════════════════════════════

def get_db() -> sqlite3.Connection:
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH, detect_types=sqlite3.PARSE_DECLTYPES)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA journal_mode=WAL")
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db


@app.teardown_appcontext
def close_db(exc=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


@contextmanager
def get_cursor():
    db  = get_db()
    cur = db.cursor()
    try:
        yield cur
        db.commit()
    except Exception:
        db.rollback()
        raise


def init_db():
    """Create tables and seed demo data if empty."""
    with app.app_context():
        db = get_db()
        db.executescript("""
            CREATE TABLE IF NOT EXISTS players (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                username        TEXT    NOT NULL UNIQUE,
                level           INTEGER NOT NULL DEFAULT 1,
                online          INTEGER NOT NULL DEFAULT 0,
                playstyle       TEXT    NOT NULL DEFAULT 'Casual',
                region          TEXT    NOT NULL DEFAULT 'EUW',
                matches_today   INTEGER NOT NULL DEFAULT 0,
                platforms       TEXT    NOT NULL DEFAULT 'PC',
                games           TEXT    NOT NULL DEFAULT '',
                likes           INTEGER NOT NULL DEFAULT 0,
                skips           INTEGER NOT NULL DEFAULT 0,
                created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS events (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                title           TEXT    NOT NULL,
                game            TEXT    NOT NULL,
                host            TEXT    NOT NULL DEFAULT 'MatchCore',
                date            TEXT    NOT NULL,
                time            TEXT    NOT NULL DEFAULT '20:00',
                slots_total     INTEGER NOT NULL DEFAULT 10,
                slots_joined    INTEGER NOT NULL DEFAULT 0,
                prize           TEXT,
                region          TEXT    NOT NULL DEFAULT 'Global',
                tag             TEXT    NOT NULL DEFAULT 'CASUAL',
                created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS profile (
                id              INTEGER PRIMARY KEY DEFAULT 1,
                username        TEXT    NOT NULL DEFAULT 'Player_One',
                email           TEXT    NOT NULL DEFAULT 'player@matchcore.gg',
                region          TEXT    NOT NULL DEFAULT 'EUW',
                language        TEXT    NOT NULL DEFAULT 'Azerbaijani',
                playstyle       TEXT    NOT NULL DEFAULT 'Competitive',
                level           INTEGER NOT NULL DEFAULT 32,
                discord         TEXT    DEFAULT '',
                bio             TEXT    DEFAULT '',
                public          INTEGER NOT NULL DEFAULT 1,
                avatar          TEXT    DEFAULT '',
                platforms       TEXT    NOT NULL DEFAULT 'PC',
                games           TEXT    NOT NULL DEFAULT 'Valorant,CS2,Apex Legends,Elden Ring',
                matches         INTEGER NOT NULL DEFAULT 128,
                hours_played    INTEGER NOT NULL DEFAULT 340,
                events_joined   INTEGER NOT NULL DEFAULT 14,
                win_rate        INTEGER NOT NULL DEFAULT 68
            );
        """)
        db.commit()

        # Seed players if table is empty
        count = db.execute("SELECT COUNT(*) FROM players").fetchone()[0]
        if count == 0:
            _seed_players(db)

        # Seed events if table is empty
        ecount = db.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        if ecount == 0:
            _seed_events(db)

        # Ensure profile row exists
        pcount = db.execute("SELECT COUNT(*) FROM profile WHERE id=1").fetchone()[0]
        if pcount == 0:
            db.execute("INSERT INTO profile (id) VALUES (1)")
            db.commit()


def _seed_players(db: sqlite3.Connection):
    players = [
        ("ZephyrVoid",       84, 1, "Competitive", "EUW",  22, "PC,PS5",    "Valorant,Apex Legends,CS2"),
        ("NovaShard",        61, 1, "Casual",      "NA",    8, "PC",        "Minecraft,Stardew Valley"),
        ("IronPulse_AZ",     99, 0, "Hardcore",    "EUW",  41, "PC,Xbox",   "Dark Souls,Elden Ring,Sekiro"),
        ("GhostFrame",       77, 1, "Competitive", "EUW",  17, "PC",        "League of Legends,Dota 2,CS2"),
        ("PixelStorm",       45, 1, "Casual",      "MENA",  5, "PS5,Mobile","FIFA 25,Fortnite"),
        ("NightCrawler_KR",  91, 0, "Competitive", "KR",   33, "PC",        "StarCraft 2,League of Legends,Valorant"),
        ("ShadowByte",       73, 1, "Hardcore",    "EUW",  28, "PC",        "Elden Ring,Sekiro,Bloodborne"),
        ("CrystalRift",      55, 1, "Casual",      "NA",   11, "Xbox,PC",   "Minecraft,Fortnite,Roblox"),
        ("NeonFrag",         88, 0, "Competitive", "EUW",  36, "PC",        "CS2,Valorant,R6 Siege"),
        ("BlazeRunner",      67, 1, "Casual",      "NA",   14, "PS5",       "FIFA 25,NBA 2K25,Fortnite"),
    ]
    db.executemany(
        "INSERT INTO players (username,level,online,playstyle,region,matches_today,platforms,games) VALUES (?,?,?,?,?,?,?,?)",
        players,
    )
    db.commit()


def _seed_events(db: sqlite3.Connection):
    events = [
        ("Valorant 5v5 Championship",         "Valorant",     "MatchCore",     "2026-06-15", "18:00", 10, 7,  "$500",  "EUW",    "TOURNAMENT"),
        ("Casual Friday — Minecraft Build",   "Minecraft",    "NovaShard",     "2026-06-13", "20:00",  8, 3,  None,    "Global", "CASUAL"),
        ("CS2 Ranked Grind Night",            "CS2",          "ZephyrVoid",    "2026-06-14", "22:00",  5, 4,  None,    "EUW",    "RANKED"),
        ("Elden Ring Boss Rush",              "Elden Ring",   "IronPulse_AZ",  "2026-06-16", "19:00",  4, 1,  None,    "EUW",    "HARDCORE"),
        ("League of Legends Clash Night",     "LoL",          "GhostFrame",    "2026-06-17", "21:00", 10, 10, "$200",  "EUW",    "TOURNAMENT"),
        ("Apex Legends Friday Grind",         "Apex Legends", "PixelStorm",    "2026-06-20", "17:00",  6, 2,  None,    "MENA",   "CASUAL"),
    ]
    db.executemany(
        "INSERT INTO events (title,game,host,date,time,slots_total,slots_joined,prize,region,tag) VALUES (?,?,?,?,?,?,?,?,?,?)",
        events,
    )
    db.commit()


# ══════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════

def row_to_player(row: sqlite3.Row) -> dict:
    return {
        "id":            row["id"],
        "username":      row["username"],
        "level":         row["level"],
        "online":        bool(row["online"]),
        "playstyle":     row["playstyle"],
        "region":        row["region"],
        "matches_today": row["matches_today"],
        "platforms":     row["platforms"].split(",") if row["platforms"] else [],
        "games":         row["games"].split(",")     if row["games"]     else [],
    }


def row_to_event(row: sqlite3.Row) -> dict:
    return {
        "id":           row["id"],
        "title":        row["title"],
        "game":         row["game"],
        "host":         row["host"],
        "date":         row["date"],
        "time":         row["time"],
        "slots_total":  row["slots_total"],
        "slots_joined": row["slots_joined"],
        "prize":        row["prize"],
        "region":       row["region"],
        "tag":          row["tag"],
    }


def json_error(msg: str, status: int = 400):
    return jsonify({"error": msg}), status


# ══════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════

# ── Stats ────────────────────────────────────────────────────
@app.get("/api/stats")
def get_stats():
    db = get_db()
    player_count = db.execute("SELECT COUNT(*) FROM players").fetchone()[0]
    event_count  = db.execute(
        "SELECT COUNT(*) FROM events WHERE date >= ?",
        (date.today().isoformat(),)
    ).fetchone()[0]
    return jsonify({
        "players":  f"{player_count:,}",
        "events":   event_count,
        "avg_ping": random.randint(85, 115),  # simulated
    })


# ── Players ──────────────────────────────────────────────────
@app.get("/api/players")
def get_players():
    game      = request.args.get("game",      "").strip()
    region    = request.args.get("region",    "").strip()
    playstyle = request.args.get("playstyle", "").strip()
    online    = request.args.get("online",    "").strip()

    query  = "SELECT * FROM players WHERE 1=1"
    params = []

    if region:
        query += " AND region = ?"; params.append(region)
    if playstyle:
        query += " AND playstyle = ?"; params.append(playstyle)
    if game:
        query += " AND games LIKE ?"; params.append(f"%{game}%")
    if online in ("true", "false"):
        query += " AND online = ?"; params.append(1 if online == "true" else 0)

    query += " ORDER BY online DESC, level DESC"

    rows = get_db().execute(query, params).fetchall()
    return jsonify({"players": [row_to_player(r) for r in rows]})


@app.post("/api/players/<int:player_id>/like")
def like_player(player_id: int):
    with get_cursor() as cur:
        cur.execute("UPDATE players SET likes = likes + 1 WHERE id = ?", (player_id,))
        if cur.rowcount == 0:
            return json_error("Player not found", 404)
    return jsonify({"status": "liked", "player_id": player_id})


@app.post("/api/players/<int:player_id>/skip")
def skip_player(player_id: int):
    with get_cursor() as cur:
        cur.execute("UPDATE players SET skips = skips + 1 WHERE id = ?", (player_id,))
        if cur.rowcount == 0:
            return json_error("Player not found", 404)
    return jsonify({"status": "skipped", "player_id": player_id})


# ── Events ────────────────────────────────────────────────────
@app.get("/api/events")
def get_events():
    tag = request.args.get("tag", "").strip()
    query  = "SELECT * FROM events WHERE 1=1"
    params = []
    if tag:
        query += " AND tag = ?"; params.append(tag)
    query += " ORDER BY date ASC, time ASC"
    rows = get_db().execute(query, params).fetchall()
    return jsonify({"events": [row_to_event(r) for r in rows]})


@app.post("/api/events")
def create_event():
    data = request.get_json(silent=True) or {}

    title       = str(data.get("title",       "")).strip()
    game        = str(data.get("game",        "")).strip()
    slots_total = int(data.get("slots_total", 10))
    date_str    = str(data.get("date",        "")).strip()
    time_str    = str(data.get("time",        "20:00")).strip()
    region      = str(data.get("region",      "Global")).strip()
    tag         = str(data.get("tag",         "CASUAL")).strip().upper()
    prize       = data.get("prize") or None
    host        = str(data.get("host",        "Player_One")).strip()

    if not title:  return json_error("title zorunludur")
    if not game:   return json_error("game zorunludur")
    if not date_str: return json_error("date zorunludur")

    # Validate date
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        return json_error("Tarix formatı YYYY-MM-DD olmalıdır")

    VALID_TAGS = {"TOURNAMENT", "CASUAL", "RANKED", "HARDCORE", "CUSTOM"}
    if tag not in VALID_TAGS:
        tag = "CASUAL"

    with get_cursor() as cur:
        cur.execute(
            "INSERT INTO events (title,game,host,date,time,slots_total,slots_joined,prize,region,tag) VALUES (?,?,?,?,?,?,0,?,?,?)",
            (title, game, host, date_str, time_str, slots_total, prize, region, tag),
        )
        event_id = cur.lastrowid

    return jsonify({"id": event_id, "title": title, "status": "created"}), 201


@app.post("/api/events/<int:event_id>/join")
def join_event(event_id: int):
    db  = get_db()
    row = db.execute("SELECT * FROM events WHERE id = ?", (event_id,)).fetchone()
    if not row:
        return json_error("Event tapılmadı", 404)
    if row["slots_joined"] >= row["slots_total"]:
        return json_error("Event dolu", 409)

    with get_cursor() as cur:
        cur.execute(
            "UPDATE events SET slots_joined = slots_joined + 1 WHERE id = ? AND slots_joined < slots_total",
            (event_id,),
        )
    return jsonify({"event": row["title"], "status": "joined"})


# ── Profile ──────────────────────────────────────────────────
@app.get("/api/profile")
def get_profile():
    row = get_db().execute("SELECT * FROM profile WHERE id = 1").fetchone()
    if not row:
        return json_error("Profile not found", 404)
    return jsonify({
        "username":  row["username"],
        "email":     row["email"],
        "region":    row["region"],
        "language":  row["language"],
        "playstyle": row["playstyle"],
        "level":     row["level"],
        "discord":   row["discord"],
        "bio":       row["bio"],
        "public":    bool(row["public"]),
        "avatar":    row["avatar"],
        "platforms": row["platforms"].split(",") if row["platforms"] else [],
        "games":     row["games"].split(",")     if row["games"]     else [],
        "stats": {
            "matches":       row["matches"],
            "hours_played":  row["hours_played"],
            "events_joined": row["events_joined"],
            "win_rate":      row["win_rate"],
        },
    })


@app.put("/api/profile")
def update_profile():
    data = request.get_json(silent=True) or {}

    username  = str(data.get("username",  "")).strip()
    email     = str(data.get("email",     "")).strip()
    region    = str(data.get("region",    "")).strip()
    language  = str(data.get("language",  "")).strip()
    playstyle = str(data.get("playstyle", "")).strip()
    discord   = str(data.get("discord",   "")).strip()
    bio       = str(data.get("bio",       "")).strip()
    public    = int(bool(data.get("public", True)))

    if not username:
        return json_error("username boş ola bilməz")

    with get_cursor() as cur:
        cur.execute("""
            UPDATE profile
            SET username=?, email=?, region=?, language=?, playstyle=?, discord=?, bio=?, public=?
            WHERE id=1
        """, (username, email, region, language, playstyle, discord, bio, public))

    return jsonify({"status": "updated"})


# ── Setup / Onboarding ────────────────────────────────────────
@app.post("/api/setup")
def setup_profile():
    data = request.get_json(silent=True) or {}

    username  = str(data.get("username",  "Player_One")).strip()
    email     = str(data.get("email",     "")).strip()
    playstyle = str(data.get("playstyle", "Casual")).strip()
    region    = str(data.get("region",    "EUW")).strip()
    games     = ",".join(data.get("games",     []))
    platforms = ",".join(data.get("platforms", ["PC"]))

    if not username:
        return json_error("username zorunludur")

    with get_cursor() as cur:
        cur.execute("""
            UPDATE profile
            SET username=?, email=?, playstyle=?, region=?, games=?, platforms=?, level=1,
                matches=0, hours_played=0, events_joined=0
            WHERE id=1
        """, (username, email, playstyle, region, games, platforms))

    return jsonify({"status": "setup complete", "username": username}), 201


# ══════════════════════════════════════════════════════════════
#  ERROR HANDLERS
# ══════════════════════════════════════════════════════════════

@app.errorhandler(404)
def not_found(e):
    return json_error("Endpoint tapılmadı", 404)


@app.errorhandler(405)
def method_not_allowed(e):
    return json_error("Bu metod icazəli deyil", 405)


@app.errorhandler(500)
def internal_error(e):
    return json_error("Server xətası", 500)


# ══════════════════════════════════════════════════════════════
#  ENTRY POINT
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    init_db()
    print(f"✅  MatchCore API → http://localhost:{PORT}/api")
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
