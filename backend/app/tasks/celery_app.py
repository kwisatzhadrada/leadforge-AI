from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "leadforge",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.report_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_routes={
        "app.tasks.report_tasks.generate_report_task": {"queue": "reports"},
    },
    task_soft_time_limit=300,   # 5 min soft limit
    task_time_limit=600,        # 10 min hard limit
    result_expires=86400,       # results expire after 24h
)
