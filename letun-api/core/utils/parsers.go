package utils

import (
	"strconv"
	"strings"
)

func ParseQueryInt(value string, defaultVal int) int {
	if v, err := strconv.Atoi(value); err == nil {
		return v
	}
	return defaultVal
}

func ParseOptionalInt(value string) *int {
	if v, err := strconv.Atoi(value); err == nil {
		return &v
	}
	return nil
}
func ParseArray[T any](value string, parseFunc func(string) (T, error)) ([]T, error) {
	if strings.TrimSpace(value) == "" {
		return []T{}, nil
	}

	parts := strings.Split(value, ",")
	result := make([]T, 0, len(parts))

	for _, part := range parts {
		part = strings.TrimSpace(part)
		v, err := parseFunc(part)
		if err != nil {
			return nil, err
		}
		result = append(result, v)
	}

	return result, nil
}
