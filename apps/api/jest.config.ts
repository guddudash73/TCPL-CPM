import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/test"],
  transform: { "^.+\\.ts$": "ts-jest" },
  moduleFileExtensions: ["ts", "js", "json"],
  globals: { "ts-jest": { tsconfig: "<rootDir>/tsconfig.jest.json" } },
  setupFilesAfterEnv: ["<rootDir>/src/test/helpers/test-env.ts"],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  maxWorkers: "50%",
};

export default config;
