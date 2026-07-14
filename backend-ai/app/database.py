from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings
import logging

logger = logging.getLogger(__name__)

engine = None
try:
    # Try connecting to PostgreSQL
    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Connected to PostgreSQL successfully.")
except Exception as e:
    logger.warning(f"Could not connect to PostgreSQL ({e}). Falling back to SQLite for local development.")
    sqlite_url = "sqlite:///./smart_agriculture.db"
    engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    try:
        with engine.connect() as conn:
            # Enable the pgvector extension if it's PostgreSQL
            if "postgresql" in str(engine.url):
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                conn.commit()
                logger.info("pgvector extension verified on PostgreSQL.")
            else:
                # Create SQLite tables if they do not exist
                Base.metadata.create_all(bind=engine)
                logger.info("SQLite database initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
