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
        # Assuming the CSV has 'Vorname' (first name) and 'Nachname' (last name) columns
        # Adjust these field names based on the actual CSV structure
        raw = record.get('id|nachname|vorname|titel|verein|mglnr|status|dwz|dwzindex|turniercode|turnierende|fideid|fideelo|fidetitel', '').strip()
        first_name = raw.split("|")[2]
        last_name = raw.split("|")[1]
        # Create full name
        if first_name and last_name:
            full_name = f"{first_name} {last_name}"
        elif first_name:
            full_name = first_name
        elif last_name:
            full_name = last_name
        else:
            continue  # Skip if no name data
            
        players.append(full_name)
    
    return players

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
    output_file = "data/filter-whitelist.json"

    all_players = []

    print(f"Fetching player data from {len(zps_numbers)} ZPS number(s)...\n")

    # Fetch players from each ZPS number
    for zps in zps_numbers:
        url = f"{base_url}?zps={zps}&format=csv"
        print(f"Fetching data for ZPS: {zps}")

        data = fetch_and_parse_csv(url)

        if data:
            print(f"  ✓ Successfully fetched {len(data)} records")

            # Extract player names
            players = extract_player_names(data)
            print(f"  ✓ Extracted {len(players)} player names")

            # Add to combined list
            all_players.extend(players)
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
        save_to_json(unique_players, output_file)
    else:
        print("Failed to fetch any player data")

if __name__ == "__main__":
    main()