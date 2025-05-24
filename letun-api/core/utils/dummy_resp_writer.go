package utils

import "net/http"

type DummyResponseWriter struct{}

func (*DummyResponseWriter) Header() http.Header        { return http.Header{} }
func (*DummyResponseWriter) Write([]byte) (int, error)  { return 0, nil }
func (*DummyResponseWriter) WriteHeader(statusCode int) {}
