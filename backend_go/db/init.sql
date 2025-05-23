CREATE EXTENSION IF NOT EXISTS postgis;

DROP TABLE IF EXISTS no_fly_zones;
CREATE TABLE no_fly_zones (
    id SERIAL PRIMARY KEY,
    name TEXT,
    polygon GEOMETRY(POLYGON, 4326)
);

INSERT INTO no_fly_zones (name, polygon)
VALUES (
    'Zone A',
    ST_GeomFromText('POLYGON((71.4290 51.1270, 71.4350 51.1270, 71.4350 51.1330, 71.4290 51.1330, 71.4290 51.1270))', 4326)
);