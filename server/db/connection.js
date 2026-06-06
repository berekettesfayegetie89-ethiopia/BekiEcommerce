const { Sequelize } = require("sequelize");

const isLocal = (url) =>
  !url || url.includes("localhost") || url.includes("127.0.0.1");

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: false,
      dialectOptions: isLocal(process.env.DATABASE_URL)
        ? {}
        : { ssl: { require: true, rejectUnauthorized: false } },
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    })
  : new Sequelize(
      process.env.DB_NAME || "bekishop",
      process.env.DB_USER || "postgres",
      process.env.DB_PASSWORD || "",
      {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        dialect: "postgres",
        logging: false,
        pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      },
    );

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
