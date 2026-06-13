from sqlalchemy import create_engine, text
import os

DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://postgres:L22160121@localhost:5433/erp_db')
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    conn.execute(text('CREATE SCHEMA IF NOT EXISTS core'))
    conn.commit()
print('OK: schema core ensured')
