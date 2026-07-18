import json

from backend.app.db.connection import transaction
from backend.app.db.schema import SCHEMA

BASE = "https://images.unsplash.com/photo-"
IMAGES = [BASE + value + "?auto=format&fit=crop&w=1400&q=85" for value in ["1449158743715-0a90ebb6d2d8", "1600047509807-ba8f99d2cdde", "1600585154340-be6161a56a0c", "1520984032042-162d526883e0", "1570077188670-e3a8d69ac5ff", "1522708323590-d24dbb6b0267", "1520250497591-112f2f40a3f4", "1601918774946-25832a4be0d6"]]
LISTINGS = [
    (2, "Glass house above the valley", "Wake up to uninterrupted mountain views in this quiet, architect-designed retreat. Floor-to-ceiling glass, a wood stove and an outdoor soaking tub make it ideal in every season.", "Manali", "India", "Entire cabin", "Amazing views", 185, 55, 42, 4, 2, 2, 2, 4.96, 124, ["Mountain view", "Hot tub", "Indoor fireplace", "Fast wifi", "Kitchen", "Free parking"], 32.2432, 77.1892),
    (3, "Cliffside villa with infinity pool", "A private coastal hideaway with cinematic sunset views, breezy open-plan interiors and direct access to a secluded cove.", "Uluwatu", "Indonesia", "Entire villa", "Beachfront", 310, 70, 58, 6, 3, 3, 3, 4.91, 89, ["Ocean view", "Private pool", "Beach access", "Air conditioning", "Kitchen", "Breakfast"], -8.8291, 115.0849),
    (2, "Quiet riad in the old medina", "Traditional craft meets calm modern design around a sunlit courtyard. The roof terrace looks across the medina to the Atlas Mountains.", "Marrakesh", "Morocco", "Entire home", "Design", 142, 38, 31, 4, 2, 2, 2, 4.88, 211, ["Courtyard view", "Rooftop terrace", "Breakfast", "Air conditioning", "Wifi", "Dedicated workspace"], 31.6295, -7.9811),
    (3, "Nordic cabin beneath the aurora", "A minimal timber cabin beside a frozen lake, purpose-built for northern lights watching with a glass-roof bedroom and private sauna.", "Rovaniemi", "Finland", "Entire cabin", "Arctic", 225, 50, 45, 3, 1, 2, 1, 4.99, 73, ["Lake view", "Private sauna", "Northern lights view", "Fireplace", "Kitchen", "Snowshoes"], 66.5039, 25.7294),
    (2, "Sun-washed cave house", "Carved into the caldera with a private terrace, plunge pool and blue-domed views. A peaceful base minutes from Oia's lanes.", "Santorini", "Greece", "Cave house", "Amazing pools", 270, 62, 49, 2, 1, 1, 1, 4.94, 156, ["Caldera view", "Plunge pool", "Patio", "Air conditioning", "Wifi", "Daily housekeeping"], 36.4618, 25.3753),
    (3, "Loft in the heart of the city", "An airy converted warehouse with original brick, curated art and a chef's kitchen, steps from galleries and celebrated restaurants.", "New York", "United States", "Entire loft", "Iconic cities", 198, 65, 52, 2, 1, 1, 1, 4.85, 302, ["City skyline view", "Elevator", "Air conditioning", "Chef's kitchen", "Washer", "Dedicated workspace"], 40.7181, -74.0022),
    (2, "Treehouse among ancient cedars", "A handcrafted hideaway suspended in the forest canopy with a rope bridge, outdoor shower and reading nook.", "Vancouver Island", "Canada", "Treehouse", "Treehouses", 165, 40, 34, 2, 1, 1, 1, 4.97, 97, ["Forest view", "Outdoor shower", "Fireplace", "Hammock", "Kitchenette", "Free parking"], 49.6506, -125.4494),
    (3, "Lake Como garden apartment", "An elegant apartment in a restored villa with private garden access and a stone path down to the lake.", "Bellagio", "Italy", "Entire apartment", "Lakefront", 240, 58, 44, 4, 2, 2, 1.5, 4.92, 118, ["Lake view", "Private garden", "Waterfront", "Kitchen", "Air conditioning", "Washer"], 45.9876, 9.2614),
]

DISCOVERY_HOMES = [
    ("Sunlit apartment near Candolim beach", "North Goa", "Entire apartment", "Beachfront", 128, 4, 2, 2, 2),
    ("Heritage guest house in Calangute", "North Goa", "Entire home", "Design", 112, 4, 2, 2, 2),
    ("Garden home in Anjuna", "North Goa", "Entire home", "Amazing views", 145, 5, 2, 3, 2),
    ("Poolside villa in Mapusa", "North Goa", "Entire villa", "Amazing pools", 205, 6, 3, 3, 3),
    ("Riverside retreat in Candolim", "North Goa", "Entire home", "Amazing views", 168, 4, 2, 2, 2),
    ("Quiet design flat in Siolim", "North Goa", "Entire apartment", "Design", 105, 3, 1, 2, 1),
    ("Palm courtyard cottage in Assagao", "North Goa", "Entire home", "Design", 138, 4, 2, 2, 2),
    ("Tropical loft near Vagator", "North Goa", "Entire loft", "Design", 121, 3, 1, 2, 1),
    ("French quarter courtyard home", "Puducherry", "Entire home", "Design", 118, 4, 2, 2, 2),
    ("Colorful villa near White Town", "Puducherry", "Entire villa", "Design", 156, 6, 3, 3, 3),
    ("Sea breeze apartment", "Puducherry", "Entire apartment", "Beachfront", 98, 3, 1, 2, 1),
    ("Tamil heritage bungalow", "Puducherry", "Entire home", "Amazing views", 132, 5, 2, 3, 2),
    ("Minimal studio by the promenade", "Puducherry", "Entire apartment", "Design", 84, 2, 1, 1, 1),
    ("Private pool house in Auroville", "Puducherry", "Entire villa", "Amazing pools", 189, 6, 3, 3, 3),
    ("Colonial balcony apartment", "Puducherry", "Entire apartment", "Design", 109, 4, 2, 2, 2),
    ("Artist home near Serenity Beach", "Puducherry", "Entire home", "Design", 127, 4, 2, 2, 2),
]

DISCOVERY_COORDINATES = [
    (15.514, 73.768),
    (15.544, 73.755),
    (15.574, 73.742),
    (15.592, 73.812),
    (15.518, 73.762),
    (15.625, 73.769),
    (15.589, 73.807),
    (15.598, 73.734),
    (11.934, 79.831),
    (11.929, 79.825),
    (11.945, 79.839),
    (11.941, 79.814),
    (11.936, 79.835),
    (12.006, 79.811),
    (11.931, 79.828),
    (11.963, 79.842),
]


def _seed_discovery_homes(database) -> None:
    for index, home in enumerate(DISCOVERY_HOMES):
        title, city, property_type, category, price, max_guests, bedrooms, beds, baths = home
        latitude, longitude = DISCOVERY_COORDINATES[index]
        gallery = [IMAGES[(index + offset) % len(IMAGES)] for offset in range(5)]
        if database.execute("SELECT 1 FROM listings WHERE title=?", (title,)).fetchone():
            database.execute(
                "UPDATE listings SET latitude=?, longitude=?, images=? WHERE title=?",
                (latitude, longitude, json.dumps(gallery), title),
            )
            continue
        database.execute(
            """INSERT INTO listings(
                host_id,title,description,city,country,property_type,category,price,
                cleaning_fee,service_fee,max_guests,bedrooms,beds,baths,rating,
                review_count,amenities,images,latitude,longitude
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                2 if index % 2 == 0 else 3,
                title,
                f"A thoughtfully hosted {property_type.lower()} in {city}, close to local food, culture and favorite neighbourhood spots.",
                city,
                "India",
                property_type,
                category,
                price,
                38,
                31,
                max_guests,
                bedrooms,
                beds,
                baths,
                round(4.82 + (index % 6) * 0.03, 2),
                34 + index * 7,
                json.dumps(["Wifi", "Kitchen", "Air conditioning", "Dedicated workspace"]),
                json.dumps(gallery),
                latitude,
                longitude,
            ),
        )


def initialize_database() -> None:
    with transaction() as database:
        database.executescript(SCHEMA)
        if database.execute("SELECT COUNT(*) FROM users").fetchone()[0]:
            _seed_discovery_homes(database)
            return
        database.executemany("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?)", [(1, "Alex Morgan", "https://i.pravatar.cc/160?img=12", "guest", 2021, 0), (2, "Maya Chen", "https://i.pravatar.cc/160?img=47", "host", 2018, 1), (3, "Jon Bell", "https://i.pravatar.cc/160?img=11", "host", 2019, 1)])
        rows = []
        for index, listing in enumerate(LISTINGS):
            gallery = [IMAGES[(index + offset) % len(IMAGES)] for offset in range(5)]
            rows.append(listing[:16] + (json.dumps(listing[16]), json.dumps(gallery)) + listing[17:])
        database.executemany("""INSERT INTO listings(host_id,title,description,city,country,property_type,category,price,cleaning_fee,service_fee,max_guests,bedrooms,beds,baths,rating,review_count,amenities,images,latitude,longitude) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""", rows)
        database.executemany("INSERT INTO reviews(listing_id,user_name,avatar,rating,body,created_at) VALUES (?,?,?,?,?,?)", [(1, "Priya", "https://i.pravatar.cc/80?img=32", 5, "The view is even better than the photos. Thoughtful design and a wonderfully responsive host.", "2026-05-12"), (1, "Sam", "https://i.pravatar.cc/80?img=15", 5, "A genuinely peaceful stay. We spent every evening by the fire and would return in a heartbeat.", "2026-04-04"), (2, "Nora", "https://i.pravatar.cc/80?img=25", 5, "Beautiful villa, total privacy, and the sunset from the pool was unforgettable.", "2026-03-18")])
        database.execute("INSERT INTO bookings(listing_id,guest_id,check_in,check_out,guests,nights,total,status) VALUES (1,1,'2026-08-10','2026-08-14',2,4,837,'confirmed')")
        database.execute("INSERT INTO favorites VALUES (1, 3)")
        _seed_discovery_homes(database)
