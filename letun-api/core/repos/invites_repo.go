package repos

import (
	"letun-api/core/db"
	"letun-api/core/models"
	"strconv"
	"time"

	"github.com/patrickmn/go-cache"
)

type InvitesRepo struct{}

var invitesCache = cache.New(5*time.Minute, 10*time.Minute)

func (r *InvitesRepo) GetInviteById(id int) (*models.Invite, error) {
	var invite models.Invite
	err := db.DB.Where("id = ?", id).First(&invite).Error
	return &invite, err
}

func (r *InvitesRepo) GetNewInviteId() (int, error) {
	var id int
	err := db.DB.Raw("SELECT nextval('invites_id_seq')").Scan(&id).Error
	return id, err
}

func (r *InvitesRepo) Create(invite *models.Invite) error {
	err := db.DB.Create(&invite).Error
	if err == nil {
		invitesCache.Delete("invite:id:" + strconv.Itoa(invite.Id))
		invitesCache.Delete("invite:email:" + invite.Email)
	}
	return err
}

func (r *InvitesRepo) Update(invite *models.Invite) error {
	invitesCache.Delete("invite:id:" + strconv.Itoa(invite.Id))
	invitesCache.Delete("invite:email:" + invite.Email)
	return db.DB.Save(invite).Error
}

func (r *InvitesRepo) List(filter string, page int, take int) ([]models.Invite, int, error) {
	var invitesList []models.Invite
	var totalCount int64

	query := db.DB.Model(&models.Invite{})

	if filter != "" {
		filter := "%" + filter + "%"
		query = query.Where("email ILIKE", filter, filter)
	}

	if err := query.Count(&totalCount).Error; err != nil {
		return []models.Invite{}, 0, err
	}

	if page < 1 {
		page = 1
	}
	offset := (page - 1) * take

	if err := query.
		Limit(take).
		Offset(offset).
		Find(&invitesList).Error; err != nil {
		return []models.Invite{}, 0, err
	}

	return invitesList, int(totalCount), nil
}

func (r *InvitesRepo) GetInviteByEmail(email string) (*models.Invite, error) {
	var invite models.Invite
	err := db.DB.Where("email = ?", email).First(&invite).Error
	return &invite, err
}

func (r *InvitesRepo) Delete(invite *models.Invite) error {
	return db.DB.Delete(invite).Error
}
