from typing import Any, Dict, List, Optional, Iterable
from sqlalchemy import text
from sqlalchemy.engine import Row
from datetime import datetime


def row_to_dict(row: Optional[Row]) -> Optional[Dict[str, Any]]:
    if row is None:
        return None
    return dict(row._mapping)


def rows_to_list(rows: Iterable[Row]) -> List[Dict[str, Any]]:
    return [dict(r._mapping) for r in rows]


def safe_execute(db, stmt, params: Optional[Dict[str, Any]] = None, commit: bool = False):
    """Ejecuta una sentencia SQL y opcionalmente hace commit.

    Retorna el resultado de `db.execute`.
    """
    res = db.execute(stmt, params or {})
    if commit:
        db.commit()
    return res


def paginate_by_created_at(db, base_select: str, params: Optional[Dict[str, Any]] = None, cursor: Optional[str] = None, limit: int = 10) -> Dict[str, Any]:
    """Paginador genérico por `created_at` usado en varias rutas.

    - `base_select` debe contener la cláusula FROM y condiciones base (sin ORDER/LIMIT).
    - `params` son parámetros adicionales para la consulta.
    Devuelve dict con `items`, `cursor`, `limit`, `has_more`.
    """
    p = dict(params or {})
    p["limit"] = limit + 1

    q = base_select
    if cursor:
        q += " AND created_at > :cursor ORDER BY created_at, id LIMIT :limit"
        p["cursor"] = cursor
    else:
        q += " ORDER BY created_at, id LIMIT :limit"

    result = db.execute(text(q), p).fetchall()
    has_more = len(result) > limit
    if has_more:
        result = result[:limit]

    next_cursor = None
    if result and has_more:
        last_row = dict(result[-1]._mapping)
        val = last_row.get("created_at")
        next_cursor = val.isoformat() if isinstance(val, datetime) else (str(val) if val else None)

    return {
        "items": [dict(r._mapping) for r in result],
        "cursor": next_cursor,
        "limit": limit,
        "has_more": has_more,
    }
