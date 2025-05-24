package flights

type FlightsListResponseDto struct {
	Flights []FlightInfoDto `json:"flights"`
	MaxPage int             `json:"maxPage"`
	Total   int             `json:"total"`
}
