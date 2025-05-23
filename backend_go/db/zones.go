package db

import (
	"context"
	"fmt"
	"log"
)

type NoFlyZone struct {
	ID   int
	Name string
}

// CheckZoneViolation проверяет, находится ли точка в запретной зоне
func CheckZoneViolation(lat, lon float64) ([]NoFlyZone, error) {
	query := `
		SELECT id, name 
		FROM no_fly_zones
		WHERE ST_Intersects(
			polygon,
			ST_SetSRID(ST_MakePoint($1, $2), 4326)
		)
	`
	log.Printf("📍 Пошёл запрос на проверку зоны: lat=%.6f, lon=%.6f", lat, lon)

	rows, err := Pool.Query(context.Background(), query, lon, lat)
	if err != nil {
		log.Printf("❌ Ошибка запроса зон: %v", err)
		return nil, fmt.Errorf("ошибка запроса зон: %w", err)
	}
	defer rows.Close()

	var zones []NoFlyZone
	for rows.Next() {
		var z NoFlyZone
		err := rows.Scan(&z.ID, &z.Name)
		if err != nil {
			log.Printf("⚠️ Ошибка чтения зоны: %v", err)
			continue
		}

		// 💥 ВОТ ЭТА СТРОКА ДОЛЖНА БЫТЬ
		log.Printf("➡️ Найдена зона: %s (ID %d)", z.Name, z.ID)

		zones = append(zones, z)
	}

	return zones, nil
}
