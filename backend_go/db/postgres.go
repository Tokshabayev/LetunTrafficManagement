package db

import (
	"context"
	"log"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func InitDB() {
	var err error
	Pool, err = pgxpool.New(context.Background(), "postgres://letun_user:letun_pass@localhost:5432/letun?sslmode=disable")

	if err != nil {
		log.Fatalf("❌ Ошибка подключения к БД: %v", err)
	}
}
