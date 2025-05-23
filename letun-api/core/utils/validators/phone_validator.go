package validators

import (
	"errors"

	"github.com/nyaruka/phonenumbers"
)

func ValidatePhoneNumber(phone, region string) (string, error) {
	num, err := phonenumbers.Parse(phone, region)
	if err != nil {
		return "", errors.New("invalid-phone-format")
	}

	if !phonenumbers.IsValidNumber(num) {
		return "", errors.New("invalid-phone-format")
	}

	return phonenumbers.Format(num, phonenumbers.E164), nil
}
