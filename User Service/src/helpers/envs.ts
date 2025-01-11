import dotenv from 'dotenv';

dotenv.config();

interface IEnvConfig {
  getPort(): number;
  getServerName(): string;
  getServerVersion(): string;
  getServerJwtSecret(): string;
  getProductServiceUrl(): string;
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

  public getServerJwtSecret(): string {
    if(!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not defined in the environment variables");
    }
    return process.env.JWT_SECRET || "";
  }

  public getProductServiceUrl(): string {
    if(!process.env.PRODUCT_SERVICE_URL) {
      console.error("PRODUCT_SERVICE_URL is not defined in the environment variables");
    }
    return process.env.PRODUCT_SERVICE_URL || "";
  }
}

const envConfig = new EnvConfig();

export { envConfig, IEnvConfig };
