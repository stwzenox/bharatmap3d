import sqlite3
from app.database.session import SessionLocal
from app.models.entities import Building, Floor, Property, VerticalParcel

# Check SQLite
conn = sqlite3.connect('../cadastral.db')
c = conn.cursor()
c.execute("SELECT building_id, parcel_id, building_name, floor_count, height FROM buildings WHERE building_id = 'B001'")
print("SQLite B001:", c.fetchall())
c.execute("SELECT floor_id FROM floors WHERE building_id = 'B001'")
print("SQLite Floors count:", len(c.fetchall()))
c.execute("SELECT property_id, vertical_parcel_id FROM properties WHERE building_id = 'B001'")
print("SQLite Props:", c.fetchall())
conn.close()

# Check Supabase
db = SessionLocal()
b_pg = db.query(Building).filter(Building.building_id == 'B001').first()
print("Postgres B001:", b_pg)
db.close()
