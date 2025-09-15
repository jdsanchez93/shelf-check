import requests
import re

ACCESS_TOKEN = "7749fa974b9869e8f57606ac9477decf"  # public, usually stable
POSTAL_CODE = "80003"
STORE_CODE = "1998"

# Step 1: Find the current publication ID
pubs_url = "https://api.flipp.com/flyerkit/v4.0/publications/safeway"
params = {
    "access_token": ACCESS_TOKEN,
    "locale": "en-US",
    "postal_code": POSTAL_CODE,
    "store_code": STORE_CODE,
}
resp = requests.get(pubs_url, params=params).json()
publication_id = resp[0]["id"]
print("Current publication ID:", publication_id)

# Step 2: Fetch all products for that publication
products_url = f"https://dam.flippenterprise.net/flyerkit/publication/{publication_id}/products"
products_params = {
    "display_type": "all",
    "locale": "en",
    "access_token": ACCESS_TOKEN,
}
products = requests.get(products_url, params=products_params).json()
print("Found", len(products), "products")

def normalize_safeway_product(p):
    name = p.get("name")
    brand = p.get("brand")
    details = p.get("description") or p.get("sale_story")
    dept = ", ".join(p.get("categories", [])) if p.get("categories") else None

    # Build display string
    pre = (p.get("pre_price_text") or "").strip()
    price_raw = (p.get("price_text") or "").strip()
    post = (p.get("post_price_text") or "").strip()
    price_display = " ".join(part for part in [pre, price_raw, post] if part)

    price_number = None
    quantity = 1  # default

    if pre and "for" in pre.lower():
        # Example: "3 for", price_raw = "5.00"
        m = re.search(r"(\d+)", pre)
        if m:
            quantity = int(m.group(1))
            try:
                total_price = float(price_raw.replace("$", ""))
                price_number = total_price / quantity
            except ValueError:
                pass
    else:
        try:
            price_number = float(price_raw.replace("$", ""))
        except (ValueError, AttributeError):
            pass

    # Loyalty detection
    loyalty = None
    if "member" in post.lower() or "card" in post.lower():
        loyalty = post

    return {
        "store": "Safeway",
        "name": f"{brand} {name}" if brand else name,
        "details": details,
        "dept": dept,
        "price_display": price_display if price_display else "See store for details",
        "price_number": price_number,
        "quantity": quantity,
        "loyalty": loyalty,
        "image": (p.get("images") or [None])[0],
    }

normalized_sw = [normalize_safeway_product(p) for p in products]

print(normalized_sw[0])
