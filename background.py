import requests
import csv
from io import StringIO
import json
import os
import zipfile

def fetch_and_parse_csv(url):
    """
    Fetches CSV data from a URL and parses it into a list of dictionaries.
    
    Args:
        url (str): The URL to fetch the CSV data from
        
    Returns:
        list: A list of dictionaries representing the CSV data
    """
    try:
        # Fetch the CSV data from the URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        # Parse the CSV data
        csv_data = StringIO(response.text)
        reader = csv.DictReader(csv_data, delimiter=';')
        
        # Convert to list of dictionaries
        data = list(reader)
        
        return data
    
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None
    except Exception as e:
        print(f"Error parsing CSV: {e}")
        return None

RAW_KEY = 'id|nachname|vorname|titel|verein|mglnr|status|dwz|dwzindex|turniercode|turnierende|fideid|fideelo|fidetitel'

def parse_raw_record(record):
    """
    Parses a raw DSB API record into its individual fields.

    Returns:
        dict with keys: id, nachname, vorname, titel, verein, mglnr, status,
                        dwz, dwzindex, turniercode, turnierende, fideid, fideelo, fidetitel
        or None if parsing fails
    """
    raw = record.get(RAW_KEY, '').strip()
    if not raw:
        return None
    parts = raw.split("|")
    if len(parts) < 14:
        return None
    keys = RAW_KEY.split("|")
    return dict(zip(keys, parts))


def extract_player_names(data):
    """
    Extracts player names from the CSV data.
    
    Args:
        data (list): List of dictionaries containing player data
        
    Returns:
        list: List of full player names
    """
    players = []

    for record in data:
        parsed = parse_raw_record(record)
        if not parsed:
            continue
        first_name = parsed['vorname']
        last_name = parsed['nachname']
        if first_name and last_name:
            full_name = f"{first_name} {last_name}"
        elif first_name:
            full_name = first_name
        elif last_name:
            full_name = last_name
        else:
            continue

        players.append(full_name)

    return players


def download_spieler_csv(url, filename):
    """
    Downloads the full DSB player database ZIP, extracts the CSV, and saves it.
    """
    try:
        print(f"Downloading player database from {url}...")
        response = requests.get(url)
        response.raise_for_status()

        # Extract CSV from ZIP
        from io import BytesIO
        with zipfile.ZipFile(BytesIO(response.content)) as zf:
            if 'spieler.csv' not in zf.namelist():
                print(f"  ✗ spieler.csv not found in ZIP archive (contents: {zf.namelist()})")
                return False

            csv_data = zf.read('spieler.csv')

        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'wb') as f:
            f.write(csv_data)

        line_count = csv_data.count(b'\n')
        print(f"  ✓ Extracted spieler.csv ({line_count} lines) to {filename}")
        return True

    except requests.exceptions.RequestException as e:
        print(f"  ✗ Error downloading player database: {e}")
        return False
    except zipfile.BadZipFile:
        print(f"  ✗ Downloaded file is not a valid ZIP archive")
        return False
    except Exception as e:
        print(f"  ✗ Error processing player database: {e}")
        return False


def save_to_json(players, filename):
    """
    Saves player names to a JSON file in the specified format.
    
    Args:
        players (list): List of player names
        filename (str): Output JSON file path
    """
    try:
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        # Create the JSON structure
        data = {
            "players": players
        }
        
        # Save to JSON file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"Successfully saved {len(players)} players to {filename}")
        
    except Exception as e:
        print(f"Error saving to JSON: {e}")


def main():
    # List of ZPS numbers to fetch player data from
    zps_numbers = [
        "G0353",  # Schachzwerge
        "G0314"    # Aufbau Elbe
    ]

    base_url = "https://www.schachbund.de/php/dewis/verein.php"
    whitelist_file = "data/filter-whitelist.json"
    spieler_file = "data/spieler.csv"
    spieler_url = "https://dwz.svw.info/services/files/export/csv/LV-0-csv_v2.zip"

    all_players = []

    # Download full player database
    print("=== Updating player database ===\n")
    download_spieler_csv(spieler_url, spieler_file)

    # Fetch club-specific player names for whitelist
    print(f"\n=== Updating whitelist from {len(zps_numbers)} club(s) ===\n")

    for zps in zps_numbers:
        url = f"{base_url}?zps={zps}&format=csv"
        print(f"Fetching data for ZPS: {zps}")

        data = fetch_and_parse_csv(url)

        if data:
            print(f"  ✓ Successfully fetched {len(data)} records")

            players = extract_player_names(data)
            print(f"  ✓ Extracted {len(players)} player names")
            all_players.extend(players)
        else:
            print(f"  ✗ Failed to fetch data for ZPS: {zps}")

        print()

    if all_players:
        unique_players = list(dict.fromkeys(all_players))

        print(f"Total players fetched: {len(all_players)}")
        print(f"Unique players after deduplication: {len(unique_players)}")

        print("\nFirst 10 player names:")
        for i, name in enumerate(unique_players[:10]):
            print(f"  {i+1}. {name}")

        save_to_json(unique_players, whitelist_file)
    else:
        print("Failed to fetch any player data")

if __name__ == "__main__":
    main()