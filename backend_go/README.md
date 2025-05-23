
# LetunBackend

## 🚀 Как запустить

1. Установи Go 1.20+
2. Распакуй архив
3. В терминале перейди в папку проекта

```
cd LetunBackend_Clean
go mod tidy
go run main.go
```

4. Убедись, что сервер запущен на http://localhost:8080

---

## 📡 Отправка команды start

Файл `send.json` содержит команду для запуска дрона:

```
curl.exe -X POST http://localhost:8080/command -H "Content-Type: application/json" --data-binary "@send.json"
```
