package repos

import (
	"letun-api/core/db"
	"letun-api/core/models"
	"strconv"
	"time"

	"github.com/patrickmn/go-cache"
)

type DronesRepo struct{}

var dronesCache = cache.New(5*time.Minute, 10*time.Minute)

func (r *DronesRepo) GetDroneById(id int) (*models.Drone, error) {
	cacheKey := "drone:id:" + strconv.Itoa(id)

	if cached, found := dronesCache.Get(cacheKey); found {
		return cached.(*models.Drone), nil
	}

	var invite models.Drone
	err := db.DB.Where("id = ?", id).First(&invite).Error
	return &invite, err
}

func (r *DronesRepo) GetNewDroneId() (int, error) {
	var id int
	err := db.DB.Raw("SELECT nextval('drones_id_seq')").Scan(&id).Error
	return id, err
}

func (r *DronesRepo) Create(drone *models.Drone) error {
	err := db.DB.Create(&drone).Error
	if err == nil {
		dronesCache.Add("drone:id:"+strconv.Itoa(drone.Id), drone, cache.DefaultExpiration)
	}
	return err
}

func (r *DronesRepo) Update(drone *models.Drone) error {
	dronesCache.Delete("drone:id:" + strconv.Itoa(drone.Id))
	dronesCache.Add("drone:id:"+strconv.Itoa(drone.Id), drone, cache.DefaultExpiration)
	return db.DB.Save(drone).Error
}

func (r *DronesRepo) List(filter string, page int, take int) ([]models.Drone, int, error) {
	var dronesList []models.Drone
	var totalCount int64

	query := db.DB.Model(&models.Drone{})

	if filter != "" {
		filter := "%" + filter + "%"
		query = query.Where("model ILIKE", filter, filter)
	}

	if err := query.Count(&totalCount).Error; err != nil {
		return []models.Drone{}, 0, err
	}

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * take

	if err := query.
		Limit(take).
		Offset(offset).
		Find(&dronesList).Error; err != nil {
		return []models.Drone{}, 0, err
	}

	return dronesList, int(totalCount), nil
}

func (r *DronesRepo) Delete(drone *models.Drone) error {
	dronesCache.Delete("drone:id:" + strconv.Itoa(drone.Id))
	return db.DB.Delete(drone).Error
}
