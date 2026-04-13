
import json
import re

def parse_ocr(ocr_text):
    # Regex to find "Sr. No. Drugs Name Notification No. & Date" pattern
    # Example: "1. Amidopyrine. GSR NO. 578(E)Dated23.07.1983"
    pattern = re.compile(r'(\d+)\.\s+(.*?)\s+(?:GSR|S\.O\.|G\.S\.R\.)\s+NO\.\s+.*?(?=\d+\.|$)', re.DOTALL)
    
    matches = pattern.findall(ocr_text)
    drugs = []
    for match in matches:
        sr_no = match[0]
        name = match[1].strip().replace('\n', ' ')
        # Clean up name (remove trailing dots or weird artifacts)
        name = re.sub(r'\s+', ' ', name)
        
        drugs.append({
            "id": f"banned-cdsco-{sr_no}",
            "category": "Banned Drugs",
            "drug_name": name,
            "brand_names_india": [],
            "drug_class": "Banned Combination" if "Fixed dose combination" in name else "Banned Drug",
            "mechanism_of_action": "Banned",
            "uses": ["Banned"],
            "dosage_common": "Banned",
            "side_effects_common": ["Banned"],
            "side_effects_serious": ["Prohibited by CDSCO due to safety/efficacy concerns"],
            "overdose_effects": "Banned",
            "contraindications": ["Banned"],
            "drug_interactions": ["Banned"],
            "pregnancy_safety": "Banned",
            "kidney_liver_warning": "Banned",
            "how_it_works_in_body": "Banned",
            "onset_of_action": "Banned",
            "duration_of_effect": "Banned",
            "prescription_required": True,
            "ayurvedic_or_allopathic": "Allopathic",
            "india_regulatory_status": "BANNED BY CDSCO",
            "quick_summary": f"BANNED DRUG (Entry #{sr_no}). Prohibited for manufacture and sale in India.",
            "who_should_take": "NO ONE",
            "who_should_not_take": "EVERYONE",
            "food_interactions": ["Banned"],
            "alcohol_warning": "Banned"
        })
    return drugs

# I will process the OCR in chunks in the main turn logic
