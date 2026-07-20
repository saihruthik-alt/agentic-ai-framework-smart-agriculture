import json
import math
from typing import List, Dict, Tuple
from sqlalchemy import Table, Column, Integer, String, Text, MetaData, select, insert
from app.database import engine, Base

metadata = MetaData()

# Define Agricultural Manual table schema
class CropManual(Base):
    __tablename__ = "crop_manuals"
    id = Column(Integer, primary_key=True, autoincrement=True)
    crop = Column(String(50), nullable=False)
    section = Column(String(50), nullable=False)  # sowing, landPrep, irrigation, fertilizer, pestControl, harvest
    content = Column(Text, nullable=False)
    embedding_json = Column(Text, nullable=True)  # Store vector embedding as JSON string for hybrid compatibility

# TF-IDF / Simple Bag of Words Vectorizer to avoid external model download failures
class SimpleVectorizer:
    def __init__(self):
        self.vocabulary = {}
        
    def fit_transform(self, documents: List[str]) -> List[List[float]]:
        # Tokenize and build vocabulary
        all_tokens = []
        for doc in documents:
            tokens = [w.lower() for w in doc.split() if len(w) > 2]
            all_tokens.extend(tokens)
            
        unique_tokens = list(set(all_tokens))
        self.vocabulary = {token: i for i, token in enumerate(unique_tokens)}
        
        vectors = []
        for doc in documents:
            vectors.append(self.transform(doc))
        return vectors
        
    def transform(self, doc: str) -> List[float]:
        vector = [0.0] * max(len(self.vocabulary), 1)
        if not self.vocabulary:
            return vector
            
        tokens = [w.lower() for w in doc.split() if len(w) > 2]
        for t in tokens:
            if t in self.vocabulary:
                vector[self.vocabulary[t]] += 1.0
                
        # Normalize vector
        magnitude = math.sqrt(sum(v*v for v in vector))
        if magnitude > 0:
            vector = [v / magnitude for v in vector]
        return vector

vectorizer = SimpleVectorizer()

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if len(v1) != len(v2):
        # Resize to match
        max_len = max(len(v1), len(v2))
        v1 = v1 + [0.0] * (max_len - len(v1))
        v2 = v2 + [0.0] * (max_len - len(v2))
        
    dot_product = sum(a*b for a, b in zip(v1, v2))
    mag1 = math.sqrt(sum(a*a for a in v1))
    mag2 = math.sqrt(sum(b*b for b in v2))
    if mag1 * mag2 == 0:
        return 0.0
    return dot_product / (mag1 * mag2)

def ingest_crop_manuals(db_session):
    # Check if manuals are already loaded
    existing = db_session.query(CropManual).first()
    if existing:
        return {"status": "SUCCESS", "message": "Manuals already ingested"}
        
    manual_chunks = [
        # Rice manuals
        {"crop": "Rice", "section": "irrigation", "content": "RICE WATER MANAGEMENT: Keep water level at 2-5cm standing during vegetative stage. Keep field flooded at panicle initiation. Critical drainage period is 12 days prior to harvest index."},
        {"crop": "Rice", "section": "fertilizer", "content": "RICE FERTILIZER NPK: Recommend 120:60:40 NPK kg/hectare. Split Nitrogen application into 3 stages: Basal (50%), Tillering (25%), and Panicle Initiation (25%)."},
        {"crop": "Rice", "section": "pestControl", "content": "RICE PEST DEFENSE: Brown Plant Hopper (BPH) management requires maintaining spacing. Spray Imidacloprid if counts exceed 10 hoppers per hill."},
        
        # Cotton manuals
        {"crop": "Cotton", "section": "irrigation", "content": "COTTON WATER MANUAL: Highly sensitive to root logging. Furrow irrigation recommended every 15-20 days. Avoid watering during boll burst stage to prevent fiber rot."},
        {"crop": "Cotton", "section": "fertilizer", "content": "COTTON NUTRIENT NPK: Baseline NPK ratio of 80:40:40 kg/acre. Supplement with Zinc Sulfate (5kg/acre) in chalky red clay soil profiles."},
        {"crop": "Cotton", "section": "pestControl", "content": "COTTON PEST CONTROL: Pink Bollworm is controlled using Bt seed hybrids. Apply Spinosad formulation if infestation surpasses 5% threshold."},
        
        # Chilli manuals
        {"crop": "Chilli", "section": "irrigation", "content": "CHILLI WATERING: Drip irrigation scheduled daily. Maintain soil moisture tension at 0.3 bar. Flowering stage requires steady soil moisture to check flower drop."},
        {"crop": "Chilli", "section": "fertilizer", "content": "CHILLI FERTILIZERS: High requirement of Potassium for color development. Apply 120:80:80 NPK kg/acre. Foliar spray calcium nitrate at fruit set."},
        
        # Tomato manuals
        {"crop": "Tomato", "section": "pestControl", "content": "TOMATO BLIGHT DEFENSE: Early Blight (Alternaria solani) causes target spots on lower leaves. Apply Copper Oxychloride (2.5g/L) or organic Trichoderma bio-fungicide."},
        {"crop": "Tomato", "section": "irrigation", "content": "TOMATO WATER: Keep soil uniformly moist. Wet-dry stress cycles cause blossom-end rot. Avoid overhead sprinkler runs; drip line is mandatory."}
    ]
    
    # Fit simple vectorizer vocabulary on content chunks
    contents = [chunk["content"] for chunk in manual_chunks]
    vectorizer.fit_transform(contents)
    
    for chunk in manual_chunks:
        emb = vectorizer.transform(chunk["content"])
        manual_entry = CropManual(
            crop=chunk["crop"],
            section=chunk["section"],
            content=chunk["content"],
            embedding_json=json.dumps(emb)
        )
        db_session.add(manual_entry)
        
    db_session.commit()
    return {"status": "SUCCESS", "count": len(manual_chunks)}

def search_crop_manuals(db_session, crop: str, query: str, limit: int = 2) -> List[Dict]:
    manuals = db_session.query(CropManual).filter(CropManual.crop == crop).all()
    if not manuals:
        # Generic lookup
        manuals = db_session.query(CropManual).all()
        
    query_vector = vectorizer.transform(query)
    
    results = []
    for m in manuals:
        if m.embedding_json:
            emb = json.loads(m.embedding_json)
            sim = cosine_similarity(query_vector, emb)
            results.append((sim, m))
            
    # Sort by similarity descending
    results.sort(key=lambda x: x[0], reverse=True)
    
    return [
        {
            "section": item[1].section,
            "content": item[1].content,
            "score": float(item[0])
        }
        for item in results[:limit]
    ]
