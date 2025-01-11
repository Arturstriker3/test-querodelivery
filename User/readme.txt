SERVER_PORT = 3030

API_NAME = "User Service"
API_VERSION = "1.0.0"
API_PREFIX = "/api/v1"

DB_HOST = localhost
DB_PORT = 5433
DB_USERNAME = admin
DB_PASSWORD = admin
DB_DATABASE = generic

docker build -t testquerodelivery:latest .
docker run -d -p 3030:3030 --name product-service testquerodelivery:latest