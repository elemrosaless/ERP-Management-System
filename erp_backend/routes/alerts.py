from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import get_db
from auth import get_current_user_admin

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/stock")
def stock_alerts(
    db: Session = Depends(get_db),
    admin=Depends(get_current_user_admin)
):

    result = db.execute(text("""
        SELECT 
            id,
            name,
            stock,
            CASE
                WHEN stock <= 0 THEN 'OUT_OF_STOCK'
                WHEN stock <= 5 THEN 'CRITICAL'
                WHEN stock <= 10 THEN 'LOW'
                ELSE 'OK'
            END AS status
        FROM core.products
        WHERE is_active = true
        ORDER BY stock ASC
    """)).fetchall()

    alerts = {
        "out_of_stock": [],
        "critical": [],
        "low": [],
        "ok": []
    }

    for row in result:
        item = dict(row._mapping)

        if item["status"] == "OUT_OF_STOCK":
            alerts["out_of_stock"].append(item)
        elif item["status"] == "CRITICAL":
            alerts["critical"].append(item)
        elif item["status"] == "LOW":
            alerts["low"].append(item)
        else:
            alerts["ok"].append(item)

    return alerts