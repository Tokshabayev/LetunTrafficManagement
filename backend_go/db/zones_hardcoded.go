package db

// import (
// 	"log"
// )

// // NoFlyZone — одна «запретная» зона в памяти
// type NoFlyZone struct {
// 	ID     int
// 	Name   string
// 	Points [][2]float64 // вершины полигона: [][2]float64{ {lon,lat}, … }
// }

// // inMemoryZones — здесь жёстко задаём зоны
// var inMemoryZones = []NoFlyZone{
// 	{
// 		ID:   1,
// 		Name: "Zone A",
// 		Points: [][2]float64{
// 			{71.4300, 51.1280},
// 			{71.4320, 51.1280},
// 			{71.4310, 51.1300},
// 			{71.4300, 51.1280}, // последний равен первому, чтобы замкнуть
// 		},
// 	},
// 	{
// 		ID:   2,
// 		Name: "Zone B",
// 		Points: [][2]float64{
// 			{71.4310, 51.1290},
// 			{71.4330, 51.1290},
// 			{71.4330, 51.1310},
// 			{71.4310, 51.1310},
// 			{71.4310, 51.1290},
// 		},
// 	},
// 	// добавить другие зоны по аналогии…
// }

// // CheckZoneViolation проверяет, попадает ли точка (lon, lat) в какую-либо из inMemoryZones.
// func CheckZoneViolation(lon, lat float64) ([]NoFlyZone, error) {
// 	log.Printf("📍 In-mem CheckZoneViolation: lon=%.6f, lat=%.6f", lon, lat)
// 	var hits []NoFlyZone
// 	for _, z := range inMemoryZones {
// 		if pointInPolygon(lon, lat, z.Points) {
// 			log.Printf("➡️ Found violation in-mem: %s (ID %d)", z.Name, z.ID)
// 			hits = append(hits, z)
// 		}
// 	}
// 	if len(hits) == 0 {
// 		log.Println("ℹ️ No zone violations (in-mem)")
// 	}
// 	return hits, nil
// }

// // pointInPolygon — алгоритм «ray casting» для проверки попадания точки внутрь полигона.
// func pointInPolygon(x, y float64, poly [][2]float64) bool {
// 	inside := false
// 	n := len(poly)
// 	for i := 0; i < n; i++ {
// 		j := (i + n - 1) % n
// 		xi, yi := poly[i][0], poly[i][1]
// 		xj, yj := poly[j][0], poly[j][1]
// 		// проверяем пересечение ребра [j→i] с лучом вправо от (x,y)
// 		if ((yi > y) != (yj > y)) &&
// 			(x < (xj-xi)*(y-yi)/(yj-yi)+xi) {
// 			inside = !inside
// 		}
// 	}
// 	return inside
// }
