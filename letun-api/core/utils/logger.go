package utils

import (
	"os"

	"github.com/rs/zerolog"
)

var _log = zerolog.New(zerolog.ConsoleWriter{Out: os.Stdout}).
	With().
	Timestamp().
	Logger()

func Logger() *zerolog.Logger {
	return &_log
}
