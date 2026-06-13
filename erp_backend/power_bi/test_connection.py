"""Simple script to test PostgreSQL connectivity using project .env settings.
Run: python erp_backend/power_bi/test_connection.py
"""
from pathlib import Path
from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv(Path('.').resolve())

DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'L22160121')
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = os.environ.get('DB_PORT', '5433')
DB_NAME = os.environ.get('DB_NAME', 'erp_db')

URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print('Testing DB URL:', URL)

engine = create_engine(URL)

with engine.connect() as conn:
    print('Connected. Running sample queries...')
    res = conn.execute(text("SELECT count(*) FROM core.products WHERE is_active = true")).fetchone()
    print('Active products:', res[0])
    # Try one of the views if present
    try:
        res2 = conn.execute(text("SELECT * FROM core.v_sales_summary LIMIT 5")).fetchall()
        print('v_sales_summary rows:', len(res2))
    except Exception as e:
        print('v_sales_summary not found or error:', str(e))

print('Done')
