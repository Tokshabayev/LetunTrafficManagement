package db

import (
	"context"
	"fmt"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

func Init() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgres://letun_user:letun_pass@localhost:5432/letun"
	}

	var err error
	Pool, err = pgxpool.New(context.Background(), dsn)
	if err != nil {
		log.Fatalf("Не удалось подключиться к базе данных: %v", err)
	}

	fmt.Println("✅ Подключение к PostgreSQL установлено")
}
