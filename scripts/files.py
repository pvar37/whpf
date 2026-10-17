import json
import time
from nba_api.stats.static import teams
from nba_api.stats.endpoints import commonteamroster

# 1. Build teams.json
all_teams = teams.get_teams()
teams_output = []

for t in all_teams:
    teams_output.append({
        "id": t["id"],
        "name": t["full_name"],
        "city": t["city"],
        "nickname": t["nickname"],
        "abbr": t["abbreviation"],
        "logo": f"https://cdn.nba.com/logos/nba/{t['id']}/global/L/logo.svg"
    })

with open("teams.json", "w", encoding="utf-8") as f:
    json.dump(teams_output, f, indent=2)

print(f"Saved {len(teams_output)} teams.")

# 2. Build players.json
players_output = []

for t in all_teams:
    try:
        roster = commonteamroster.CommonTeamRoster(team_id=t["id"], season="2026-27")
        df = roster.get_data_frames()[0]
        
        for _, row in df.iterrows():
            player_id = int(row["PLAYER_ID"])
            players_output.append({
                "id": player_id,
                "name": row["PLAYER"],
                "team_id": t["id"],
                "team_name": t["full_name"],
                "team_abbr": t["abbreviation"],
                "image": f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"
            })
        print(f"Fetched {t['full_name']}")
        time.sleep(0.6)  # Standard delay to avoid stats.nba.com throttling
    except Exception as e:
        print(f"Error fetching {t['full_name']}: {e}")

with open("players.json", "w", encoding="utf-8") as f:
    json.dump(players_output, f, indent=2)

print(f"Saved {len(players_output)} total players.")
