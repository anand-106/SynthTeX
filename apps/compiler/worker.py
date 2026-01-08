import os
from arq.connections import RedisSettings

from tasks import latex_job_compiler

redis_dsn = os.getenv("REDIS_URL", "redis://synthtex-redis:6379")


REDIS_SETTINGS = RedisSettings.from_dsn(redis_dsn)

class WorkerSettings:
    functions= [latex_job_compiler]

    redis_settings = REDIS_SETTINGS

