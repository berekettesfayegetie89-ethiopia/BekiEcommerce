const { Sequelize } = require('sequelize');

const sequelize = process.env.DATABASE_URL
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: process.env.DATABASE_URL.includes('localhost')
          ? false
          : { require: true, rejectUnauthorized: false },
      },
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    })
  : new Sequelize(
      process.env.DB_NAME || 'bekishop',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '',
      { host: process.env.DB_HOST || 'localhost', port: 5432, dialect: 'postgres', logging: false }
    );

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connected');
  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
    process.exit(1);
  }
};

module.exports = { sequelize, testConnection };
