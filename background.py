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
        print(record)
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
    url = "https://www.schachbund.de/php/dewis/verein.php?zps=G0353&format=csv"
    output_file = "data/filter-whitelist.json"
    
    print("Fetching CSV data...")
    data = fetch_and_parse_csv(url)
    
    if data:
        print(f"Successfully fetched {len(data)} records")
        
        # Extract player names
        players = extract_player_names(data)
        print(f"Extracted {len(players)} player names")
        
        # Display first few names
        print("\nFirst few player names:")
        for i, name in enumerate(players[:10]):
            print(f"  {i+1}. {name}")
        
        # Save to JSON file
        save_to_json(players, output_file)
        
        # Also save some basic info about the data structure
        if data:
            print(f"\nAvailable columns in CSV:")
            print(", ".join(data[0].keys()))
            
    else:
        print("Failed to fetch or parse data")

if __name__ == "__main__":
    main()