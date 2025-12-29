import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL= os.getenv("DATABASE_URL")

engine = create_engine(url=DATABASE_URL,
                        pool_size=5,
                        max_overflow=10,
                        pool_recycle=3600,
                        pool_pre_ping=True,
                        echo=False
                        )

SessionLocal = sessionmaker(bind=engine,autoflush=False)