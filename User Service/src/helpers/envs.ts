import dotenv from 'dotenv';

dotenv.config();

interface IEnvConfig {
  getPort(): number;
  getServerName(): string;
  getServerVersion(): string;
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
}

const envConfig = new EnvConfig();

export { envConfig, IEnvConfig };
