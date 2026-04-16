import requests
import csv
from io import StringIO
import json
import os

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

SPIELER_CSV_HEADER = "ID,VKZ,Mgl-Nr,Status,Spielername,Geschlecht,Spielberechtigung,Geburtsjahr,Letzte-Auswertung,DWZ,Index,FIDE-Elo,FIDE-Titel,FIDE-ID,FIDE-Land"

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


def extract_player_records(data):
    """
    Extracts player records from the API data in spieler.csv format.

    Returns:
        list of dicts with spieler.csv column keys
    """
    records = []
    for record in data:
        parsed = parse_raw_record(record)
        if not parsed:
            continue
        nachname = parsed['nachname']
        vorname = parsed['vorname']
        if not nachname and not vorname:
            continue

        spielername = f"{nachname},{vorname}" if nachname and vorname else nachname or vorname

        records.append({
            'ID': parsed['id'],
            'VKZ': parsed['verein'],
            'Mgl-Nr': parsed['mglnr'],
            'Status': parsed['status'],
            'Spielername': spielername,
            'Geschlecht': '',
            'Spielberechtigung': '',
            'Geburtsjahr': '',
            'Letzte-Auswertung': parsed['turnierende'],
            'DWZ': parsed['dwz'],
            'Index': parsed['dwzindex'],
            'FIDE-Elo': parsed['fideelo'],
            'FIDE-Titel': parsed['fidetitel'],
            'FIDE-ID': parsed['fideid'],
            'FIDE-Land': '',
        })
    return records

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

def update_spieler_csv(new_records, filename):
    """
    Merges new player records into the existing spieler.csv.
    Existing entries (matched by ID + VKZ + Mgl-Nr) are updated,
    new entries are appended.
    """
    fieldnames = SPIELER_CSV_HEADER.split(',')
    existing_rows = []
    existing_keys = set()

    # Read existing CSV
    if os.path.exists(filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    key = (row.get('ID', ''), row.get('VKZ', ''), row.get('Mgl-Nr', ''))
                    existing_keys.add(key)
                    existing_rows.append(row)
        except Exception as e:
            print(f"Error reading existing {filename}: {e}")

    added = 0
    updated = 0
    for record in new_records:
        key = (record['ID'], record['VKZ'], record['Mgl-Nr'])
        if key in existing_keys:
            # Update existing row
            for i, row in enumerate(existing_rows):
                if (row.get('ID', ''), row.get('VKZ', ''), row.get('Mgl-Nr', '')) == key:
                    # Preserve fields the API doesn't provide
                    for field in ['Geschlecht', 'Spielberechtigung', 'Geburtsjahr', 'FIDE-Land']:
                        if row.get(field):
                            record[field] = row[field]
                    existing_rows[i] = record
                    updated += 1
                    break
        else:
            existing_keys.add(key)
            existing_rows.append(record)
            added += 1

    try:
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames, quoting=csv.QUOTE_MINIMAL)
            writer.writeheader()
            writer.writerows(existing_rows)
        print(f"Successfully updated {filename}: {added} added, {updated} updated, {len(existing_rows)} total")
    except Exception as e:
        print(f"Error writing {filename}: {e}")


def main():
    # List of ZPS numbers to fetch player data from
    zps_numbers = [
        "G0353",  # Schachzwerge
        "G0314"    # Aufbau Elbe
    ]

    base_url = "https://www.schachbund.de/php/dewis/verein.php"
    whitelist_file = "data/filter-whitelist.json"
    spieler_file = "data/spieler.csv"

    all_players = []
    all_records = []

    print(f"Fetching player data from {len(zps_numbers)} ZPS number(s)...\n")

    # Fetch players from each ZPS number
    for zps in zps_numbers:
        url = f"{base_url}?zps={zps}&format=csv"
        print(f"Fetching data for ZPS: {zps}")

        data = fetch_and_parse_csv(url)

        if data:
            print(f"  ✓ Successfully fetched {len(data)} records")

            # Extract player names for whitelist
            players = extract_player_names(data)
            print(f"  ✓ Extracted {len(players)} player names")
            all_players.extend(players)

            # Extract full player records for spieler.csv
            records = extract_player_records(data)
            print(f"  ✓ Extracted {len(records)} player records")
            all_records.extend(records)
        else:
            print(f"  ✗ Failed to fetch data for ZPS: {zps}")

        print()  # Empty line for readability

    if all_players:
        # Remove duplicates while preserving order
        unique_players = list(dict.fromkeys(all_players))

        print(f"Total players fetched: {len(all_players)}")
        print(f"Unique players after deduplication: {len(unique_players)}")

        # Display first few names
        print("\nFirst 10 player names:")
        for i, name in enumerate(unique_players[:10]):
            print(f"  {i+1}. {name}")

        # Save to JSON file
        save_to_json(unique_players, whitelist_file)

        # Update spieler.csv
        print()
        update_spieler_csv(all_records, spieler_file)
    else:
        print("Failed to fetch any player data")

if __name__ == "__main__":
    main()