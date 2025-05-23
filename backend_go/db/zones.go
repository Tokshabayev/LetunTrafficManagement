package db

import (
	"context"
	"fmt"
	"log"
)

// NoFlyZone — одна «запретная» зона из БД
type NoFlyZone struct {
	ID   int
	Name string
}

// CheckZoneViolation проверяет, попадает ли точка (lon, lat) в какие-либо зоны.
// Первый аргумент — долгота, второй — широта.
func CheckZoneViolation(lon, lat float64) ([]NoFlyZone, error) {
	ctx := context.Background()

	// --- 1) Логируем входные координаты ---
	log.Printf("📍 CheckZoneViolation called with lon=%.6f, lat=%.6f", lon, lat)

	// --- 2) Логируем, в какую БД и схему мы попали ---
	var dbName string
	if err := Pool.QueryRow(ctx, "SELECT current_database()").Scan(&dbName); err == nil {
		log.Printf("🔗 Connected to database: %s", dbName)
	}
	var sp string
	if err := Pool.QueryRow(ctx, "SHOW search_path").Scan(&sp); err == nil {
		log.Printf("🔍 search_path = %q", sp)
	}

	// --- 3) Выводим все зоны, которые реально лежат в public.no_fly_zones ---
	rowsAll, err := Pool.Query(ctx,
		"SELECT id, name, ST_AsText(polygon) FROM public.no_fly_zones")
	if err != nil {
		log.Printf("❌ Error listing no_fly_zones: %v", err)
	} else {
		defer rowsAll.Close()
		for rowsAll.Next() {
			var id int
			var name, wkt string
			if err := rowsAll.Scan(&id, &name, &wkt); err != nil {
				log.Printf("❌ Scan zone error: %v", err)
			}
		}
	}

	// --- 4) Собственно проверка пересечения ---
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
		return nil, fmt.Errorf("Query zones error: %v", err)
	}
	defer rows.Close()

	var violations []NoFlyZone
	for rows.Next() {
		var z NoFlyZone
		if err := rows.Scan(&z.ID, &z.Name); err != nil {
			log.Printf("❌ Scan violation zone error: %v", err)
			continue
		}
		log.Printf("➡️ Found violation zone: %s (ID %d)", z.Name, z.ID)
		violations = append(violations, z)
	}

	if len(violations) == 0 {
		log.Println("ℹ️ No zone violations")
	}
	return violations, nil
}
