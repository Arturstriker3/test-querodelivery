import dotenv from 'dotenv';

dotenv.config();

interface IEnvConfig {
  getPort(): number;
  getServerName(): string;
  getServerVersion(): string;
  getMongoUri(): string;
  getServerJwtSecret(): string;
}

class EnvConfig implements IEnvConfig {

  public getPort(): number {
    const defaultPort = 3000;
    return Number(process.env.SERVER_PORT) || defaultPort;
  }

  public getServerName(): string {
    const defaultServerName = "Fastify";
    return process.env.API_NAME || defaultServerName;
  }

  public getServerVersion(): string {
    const defaultServerVersion = "1.0.0";
    return process.env.API_VERSION || defaultServerVersion;
  }

  public getApiPrefix(): string {
    const defaultApiPrefix = "/api/v1";
    return process.env.API_PREFIX || defaultApiPrefix;
  }

  public getMongoUri(): string {
    const defaultMongoUri = "mongodb://admin:admin@container_mongo_database:27017/generic?authSource=admin";
    const mongoUri = process.env.MONGO_URI || defaultMongoUri;
    return mongoUri;
  }

  public getServerJwtSecret(): string {
    if(!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in the environment variables");
    }
    return process.env.JWT_SECRET || "";
  }
}

const envConfig = new EnvConfig();

export { envConfig, IEnvConfig };
