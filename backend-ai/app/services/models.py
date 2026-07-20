import math

def predict_yield(crop_name: str, rainfall_mm: float, temperature_c: float, avg_moisture: float, hectares: float) -> dict:
    """
    Predicts yield in quintals and tons based on crop properties and weather profiles.
    """
    # Baseline yield rates in quintals per hectare for common Indian crops
    base_rates = {
        "rice": 45.0,
        "wheat": 35.0,
        "cotton": 22.0,
        "maize": 50.0,
        "turmeric": 60.0,
        "tomato": 250.0,
        "default": 30.0
    }
    
    crop_key = crop_name.lower().strip()
    base_rate = base_rates.get(crop_key, base_rates["default"])
    
    # Apply weather stress coefficients
    # Optimum moisture is 35% - 45% VWC
    moisture_factor = 1.0
    if avg_moisture < 30.0:
        moisture_factor = max(0.5, 1.0 - (30.0 - avg_moisture) * 0.03) # Under-watering penalty
    elif avg_moisture > 55.0:
        moisture_factor = max(0.6, 1.0 - (avg_moisture - 55.0) * 0.02) # Over-watering penalty
        
    # Optimum temperature 24C - 32C
    temp_factor = 1.0
    if temperature_c < 20.0:
        temp_factor = max(0.7, 1.0 - (20.0 - temperature_c) * 0.04) # Frost/Cold stress
    elif temperature_c > 36.0:
        temp_factor = max(0.5, 1.0 - (temperature_c - 36.0) * 0.05) # Heatwave stress
        
    predicted_yield_per_hectare = base_rate * moisture_factor * temp_factor
    total_yield_quintals = predicted_yield_per_hectare * hectares
    total_yield_tons = total_yield_quintals * 0.1
    
    return {
        "cropName": crop_name,
        "yieldPerHectareQuintals": round(predicted_yield_per_hectare, 2),
        "totalYieldQuintals": round(total_yield_quintals, 2),
        "totalYieldTons": round(total_yield_tons, 2),
        "moistureFactor": round(moisture_factor, 2),
        "temperatureFactor": round(temp_factor, 2)
    }

def estimate_carbon(pump_hours: float, nitrogen_fertilizer_bags: float, diesel_liters: float) -> dict:
    """
    Calculates carbon footprint in kg CO2 equivalent emissions.
    Emission factors:
    - Grid electricity water pumping: 0.82 kg CO2e per kWh. A 5HP pump uses ~3.7 kW. So ~3.0 kg CO2e per hour.
    - Nitrogen fertilizer (Urea): ~1.85 kg CO2e per kg of Urea. A 50kg bag is ~92.5 kg CO2e.
    - Diesel (tractors/generators): ~2.68 kg CO2e per liter.
    """
    pump_emissions = pump_hours * 3.7 * 0.82
    fertilizer_emissions = nitrogen_fertilizer_bags * 50.0 * 1.85
    diesel_emissions = diesel_liters * 2.68
    
    total_co2e = pump_emissions + fertilizer_emissions + diesel_emissions
    
    # Mitigation checklist
    mitigations = []
    if pump_hours > 20:
        mitigations.append("Adopt solar micro-irrigation pumps to drop grid electrical loads to zero.")
    if nitrogen_fertilizer_bags > 5:
        mitigations.append("Replace 30% of synthetic Urea with bio-fertilizers (Azotobacter) and organic manure to restore soil humus.")
    if diesel_liters > 15:
        mitigations.append("Adopt minimum tillage farming practices to reduce tractor fuel runs.")
        
    rating = "Excellent"
    if total_co2e > 1000:
        rating = "Critical"
    elif total_co2e > 400:
        rating = "Moderate"
        
    return {
        "pumpEmissionsKg": round(pump_emissions, 2),
        "fertilizerEmissionsKg": round(fertilizer_emissions, 2),
        "dieselEmissionsKg": round(diesel_emissions, 2),
        "totalCo2eKg": round(total_co2e, 2),
        "carbonRating": rating,
        "mitigations": mitigations
    }
