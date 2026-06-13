from sqlalchemy import create_engine, inspect
import os
from configparser import ConfigParser

url = os.environ.get('DATABASE_URL')
if not url:
    cfg = ConfigParser()
    cfg.read('alembic.ini')
    try:
        url = cfg.get('alembic', 'sqlalchemy.url')
    except Exception:
        print('ERROR: DATABASE_URL not set and alembic.ini has no sqlalchemy.url')
        raise SystemExit(1)

eng = create_engine(url)
insp = inspect(eng)
print('tables in core:', insp.get_table_names(schema='core'))
