import models
from database import engine
from sqlalchemy import text

print("Dropping all tables...")
with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE;"))
    conn.execute(text("CREATE SCHEMA public;"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO postgres;"))
    conn.execute(text("GRANT ALL ON SCHEMA public TO public;"))
    # Grant back to your dedicated user
    conn.execute(text("GRANT ALL ON SCHEMA public TO rudhita_admin;"))
    conn.execute(text("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO rudhita_admin;"))
    conn.execute(text("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO rudhita_admin;"))
    conn.commit()

print("Rebuilding schema from models.py...")
models.Base.metadata.create_all(bind=engine)

print("\n✅ Done. Tables created:")
with engine.connect() as conn:
    result = conn.execute(text(
        "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    ))
    for row in result:
        print(f"  • {row[0]}")