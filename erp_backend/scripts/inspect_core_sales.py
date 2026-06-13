from sqlalchemy import create_engine, inspect
from configparser import ConfigParser
import os

cfg = ConfigParser()
cfg.read('alembic.ini')
url = os.environ.get('DATABASE_URL') or cfg.get('alembic', 'sqlalchemy.url')
print('using URL:', url)
engine = create_engine(url)
inspector = inspect(engine)
for tablename in ['sales', 'sale_items']:
    print(f'-- TABLE {tablename}')
    try:
        cols = inspector.get_columns(tablename, schema='core')
        for col in cols:
            print(' ', col['name'], col['type'], 'nullable=' + str(col['nullable']), 'default=' + str(col.get('default')))
    except Exception as exc:
        print('  ERROR:', exc)
