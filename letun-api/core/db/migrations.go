package db

import (
	"database/sql"

	"letun-api/core/config"
	"letun-api/core/utils"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func runMigrations(db *sql.DB) {
	defer utils.Logger().Info().Msg("Migrations successfully applied")

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		utils.Logger().Fatal().Msgf("Error creating migration driver: %s", err)
	}

	m, err := migrate.NewWithDatabaseInstance(
		"file://core/db/migrations",
		config.GetVal("DbName"), driver,
	)

	if err != nil {
		utils.Logger().Fatal().Msgf("Error creating migrations: %s", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		utils.Logger().Fatal().Msgf("Error applying migrations: %s", err)
	}
}
