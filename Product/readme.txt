SERVER_PORT = 4040

API_NAME = "Product Service"
API_VERSION = "1.0.0"
API_PREFIX = "/api/v1"

MONGO_URL=mongodb://admin:admin@localhost:27018/generic?authSource=admin
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB_NAME=generic

JWT_SECRET = 1234567890123456789012345678querodelivery

docker build -t testquerodelivery1:latest .
docker run -d -p 4040:4040 --name product-service testquerodelivery1:latest