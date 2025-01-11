# Base image
FROM node:22-alpine

WORKDIR /usr/src/app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

EXPOSE 3030

ENV SERVER_PORT=3030 \
    API_NAME="User Service" \
    API_VERSION="1.0.0" \
    API_PREFIX="/api/v1" \
    DB_HOST="localhost" \
    DB_PORT=5433 \
    DB_USERNAME="admin" \
    DB_PASSWORD="admin" \
    DB_DATABASE="generic" \
    JWT_SECRET="1234567890123456789012345678querodelivery" \
    PRODUCT_SERVICE_URL="http://[::1]:4040"

CMD ["pnpm", "start"]