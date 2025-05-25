import getpass
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.chains import LLMChain
from langchain_core.prompts import ChatPromptTemplate
from serpapi.google_search import GoogleSearch
import argparse
import json
import sys

load_dotenv()
def fetch_hotels(query: str):
    """
    query: e.g. "Calangute Beach, Goa"
    Returns: list of hotel dicts from SerpAPI Google Hotels
    """

    params = {
        "engine":         "google_hotels",
        "q":              query,
        "api_key":        "42de4ca200f5ddb4f7da9960ee4109cde514041dc56da69bbbdd4815eef92a86",
        "currency": "INR",
        "check_in_date":  "2025-05-24",
        "check_out_date": "2025-05-28",
    }
    search = GoogleSearch(params)
    data = search.get_dict()
    return data.get("properties", [])   # hotels live under "properties"

res = fetch_hotels("Calangute Beach, Goa")
# print(res)


def organize_with_gemini(hotels: list, user_pref: str) -> str:
    """
    hotels: raw list from SerpAPI
    user_pref: e.g. "show me hotels near Calangute Beach Goa under ₹5000"
    Returns: clean bullet‑list text including name, price, location, and booking link
    """

    blob = ""
    for h in hotels:
        name    = h.get("name", "Unknown")
        price   = h.get("rate_per_night", {}).get("lowest", "Not specified")
        rating  = h.get("overall_rating", "Not specified")
        nearby = h.get("nearby_places", "Not specified")
        link    = h.get("hotel_reviews_link") or h.get("link") or "Not available"
        blob += f"Hotel Name: {name} — Price: {price} — Rating: {rating } — Nearby Place: {nearby} — Link: {link}\n"

    prompt = ChatPromptTemplate.from_template("""
You are a travel assistant. The user said:
  {user_pref}

From this list of hotels:
{hotel_blob}

You are a helpfull ai assitant. Filter to only those that satisfy the user’s request (e.g. price limits),
and output a **bullet‑point list** (at most 10) where each item shows:
- Hotel Name
- Price
- Rating
- Nearby place
- Booking Link

Do not return JSON, just bullet points.
""")
    
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.0-flash-001",
        google_api_key=os.environ.get("GOOGLE_API_KEY"),
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=2,
)
    chain = LLMChain(llm=llm, prompt=prompt, verbose=True)
    return chain.run(user_pref=user_pref, hotel_blob=blob)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--mode', default='interactive')
    parser.add_argument('--location', help='Location to search')
    parser.add_argument('--user_pref', help='User preferences')
    args = parser.parse_args()
    
    if args.mode == 'api':
        # API mode for server integration
        if not args.location or not args.user_pref:
            print(json.dumps({"error": "Missing location or user preference"}))
            exit(1)
            
        hotels = fetch_hotels(args.location)
        if not hotels:
            print(json.dumps([]))
        else:
            result = organize_with_gemini(hotels, args.user_pref)
            print("RAW LLM OUTPUT:", repr(result), file=sys.stderr)
            # Convert bullet list to structured data
            hotel_data = []
            lines = result.strip().split('\n')
            current_hotel = {}
            
            for line in lines:
                line = line.strip()
                if line.startswith('- Hotel Name:'):
                    if current_hotel and 'name' in current_hotel:
                        hotel_data.append(current_hotel)
                    current_hotel = {'name': line.replace('- Hotel Name:', '').strip()}
                elif line.startswith('- Price:'):
                    current_hotel['price'] = line.replace('- Price:', '').strip()
                elif line.startswith('- Rating:'):
                    current_hotel['rating'] = line.replace('- Rating:', '').strip()
                elif line.startswith('- Nearby place:'):
                    current_hotel['nearby'] = line.replace('- Nearby place:', '').strip()
                elif line.startswith('- Booking Link:'):
                    current_hotel['link'] = line.replace('- Booking Link:', '').strip()
            
            if current_hotel and 'name' in current_hotel:
                hotel_data.append(current_hotel)
                
            print(json.dumps(hotel_data))
    else:
        # Interactive mode (original code)
        user_pref = input("Your hotel request (e.g. 'hotels near Calangute Beach Goa under ₹5000'): ")
        location = user_pref.split(" under ")[0].replace("show me hotels near ", "").strip()
        hotels = fetch_hotels(location)
        if not hotels:
            print("No hotels found.")
        else:
            result = organize_with_gemini(hotels, user_pref)
            print("\nHere are the matching hotels:\n")
            print(result)
