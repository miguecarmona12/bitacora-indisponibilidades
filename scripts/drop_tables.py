import models
from database import engine

# 1. Dropping existing tables (will destroy previous test data)
models.Base.metadata.drop_all(bind=engine)
