import "reflect-metadata";
import "dotenv/config";
import { DataSource } from "typeorm";

console.log("Database Config:", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5433"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  logging: false,
  entities: ["src/entities/*.{ts,js}"],
  migrations: ["src/migrations/*.{ts,js}"],
  subscribers: [],
  synchronize: true,
});
