import requests
import browser_cookie3

# Load cookies from Chrome (works for Edge/Chromium too)
# cj = browser_cookie3.chrome(domain_name="https://kingsoopers.com")

url = "https://www.kingsoopers.com/atlas/v1/shoppable-weekly-deals/deals"
params = {
    "filter.circularId": "fbd8c12c-9826-49ba-bf8a-9ede19e14667"
}

headers = {
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    "Referer": "https://www.kingsoopers.com/weeklyad?circularId=fbd8c12c-9826-49ba-bf8a-9ede19e14667",

    # All the x- headers
    "x-ab-test": '[{"testVersion":"A","testID":"eb2943","testOrigin":"e0"},{"testVersion":"B","testID":"a86cff","testOrigin":"fb"}]',
    "x-call-origin": '{"component":"weekly ad","page":"weekly ad"}',
    "x-dtpc": "4$223829291_795h50vCKMHFIERMSBRICWCMAWSUMTPQHPJEBAA-0e0",
    "x-dtreferer": "https://www.kingsoopers.com/weeklyad",
    "x-facility-id": "62000057",
    "x-geo-location-v1": '{"id":"c479b861-887d-47c6-8ff5-138956bd2976","proxyStore":"62000991"}',
    "x-kroger-channel": "WEB",
    "x-laf-object": '[{"modality":{"type":"PICKUP","handoffLocation":{"storeId":"62000057","facilityId":"12756"},"handoffAddress":{"address":{"addressLines":["5301 W 38th Ave"],"cityTown":"Wheat Ridge","name":"Ridge Village on 38th Ave","postalCode":"80212","stateProvince":"CO","residential":false,"countryCode":"US"},"location":{"lat":39.7703823,"lng":-105.0542489}}},"sources":[{"storeId":"62000057","facilityId":"12756"}],"assortmentKeys":["75fbba0e-e2b2-49b9-ab21-bb254897b033"],"listingKeys":["62000057"]}]',
    "x-modality": '{"type":"PICKUP","locationId":"62000057"}',
    "x-modality-type": "PICKUP",
}

def normalize_kingsoopers_ad(ad):
    name = ad.get("mainlineCopy")
    details = ad.get("underlineCopy") or ad.get("description")
    dept = ", ".join(d.get("department") for d in ad.get("departments", []))
    pricing_template = ad.get("pricingTemplate")

    price_display = None
    price_number = None
    retail_price = ad.get("retailPrice")
    percent_off = ad.get("percentOff")
    quantity = ad.get("quantity") or 1

    if pricing_template == "_KRGR_2FOR" and retail_price:
        price_display = f"2 for ${retail_price}"
        price_number = float(retail_price) / 2
        quantity = 2
    elif pricing_template == "_KRGR_BOGO" and retail_price:
        price_display = f"Buy 1 Get 1 Free (${retail_price} each)"
        price_number = float(retail_price) / 2
        quantity = 2
    elif pricing_template == "_KRGR_BOGO %" and retail_price and percent_off:
        price_display = f"Buy 1 Get 1 {percent_off}% Off (${retail_price} each)"
        effective_total = float(retail_price) * (1 + (1 - percent_off/100))
        price_number = effective_total / 2
        quantity = 2
    elif retail_price and quantity > 1:
        price_display = f"{quantity} for ${retail_price}"
        price_number = float(retail_price) / quantity
    elif retail_price:
        price_display = f"${retail_price}"
        price_number = float(retail_price)
        quantity = 1

    loyalty = ad.get("loyaltyIndicator")

    return {
        "store": "King Soopers",
        "name": name,
        "details": details,
        "dept": dept,
        "price_display": price_display or "See store for details",
        "price_number": price_number,
        "quantity": quantity,
        "loyalty": loyalty,
        "image": (ad.get("images") or [{}])[0].get("url"),
    }

try:
    # resp = requests.get(url, headers=headers, params=params, cookies=cj, timeout=15)
    resp = requests.get(url, headers=headers, params=params, timeout=15)
    print("Status:", resp.status_code)
    # print("Headers:", resp.headers)
    json = resp.json()  # Parse JSON response

    # Extract ads list
    ads = json.get("data", {}).get("shoppableWeeklyDeals", {}).get("ads", [])

    print(f"Found {len(ads)} ads")

    normalized_ks = [normalize_kingsoopers_ad(ad) for ad in ads]

    print(normalized_ks[2])  # Print first product as a sample

except Exception as e:
    print("Error:", e)