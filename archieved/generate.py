import json

owners = []

for i in range(1, 26):      # blok 1 sampai 25
    for j in range(1, 26):  # unit 1 sampai 25
        owner = {
            "unit": f"{i}-{j}",
            "email": f"owner{i}-{j}@demo.com",
            "phone": f"0123{i:02d}{j:02d}"
        }
        owners.append(owner)

data = {
    "owners": owners,
    "parcels": []
}

with open("data.json", "w") as f:
    json.dump(data, f, indent=2)

print("JSON file generated: data.json")