from arq.connections import RedisSettings

from tasks import latex_job_compiler


REDIS_SETTINGS = RedisSettings.from_dsn("redis://localhost:6379")

class WorkerSettings:
    functions= [latex_job_compiler]

    redis_settings = REDIS_SETTINGS

