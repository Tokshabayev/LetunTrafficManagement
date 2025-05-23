package db

import (
	"context"
	"fmt"
	"log"
)

// NoFlyZone представляет одну «запретную» зону из БД.
type NoFlyZone struct {
	ID   int
	Name string
}

// CheckZoneViolation проверяет, попадает ли точка (lon, lat) в какие-либо запретные зоны.
// Параметры: lon — долгота, lat — широта.
func CheckZoneViolation(lon, lat float64) ([]NoFlyZone, error) {
	ctx := context.Background()

	// Лог входных координат
	log.Printf("📍 CheckZoneViolation called with lon=%.6f, lat=%.6f", lon, lat)

	// Основной запрос к PostGIS
	const query = `
        SELECT id, name
          FROM public.no_fly_zones
         WHERE ST_Intersects(
                 polygon,
                 ST_SetSRID(ST_MakePoint($1, $2), 4326)
               );
    `
	rows, err := Pool.Query(ctx, query, lon, lat)
	if err != nil {
		return nil, fmt.Errorf("Query zones error: %w", err)
	}
	defer rows.Close()

	var zones []NoFlyZone
	for rows.Next() {
		var z NoFlyZone
		if err := rows.Scan(&z.ID, &z.Name); err != nil {
			log.Printf("❌ Error scanning zone row: %v", err)
			continue
		}
		log.Printf("➡️ Found violation zone: %s (ID %d)", z.Name, z.ID)
		zones = append(zones, z)
	}
	if len(zones) == 0 {
		log.Println("ℹ️ No zone violations")
	}
	return zones, nil
}
