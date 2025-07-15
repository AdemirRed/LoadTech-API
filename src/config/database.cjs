require('dotenv').config();

module.exports = {
  development: {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    username: process.env.DB_USERNAME || 'loadtech_admin',
    password: process.env.DB_PASSWORD || 'LoadTech@2025!',
    database: process.env.DB_DATABASE || 'loadtech_master',
    searchPath: 'public,loadtech',
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
      freezeTableName: true,
      schema: 'public',
    },
    pool: {
      max: 20,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '-03:00', // Timezone do Brasil
    dialectOptions: {
      // SSL desabilitado para desenvolvimento local
    },
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
    migrationStorageTableSchema: 'public',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeds',
    seederStorageTableSchema: 'public',
  },
  production: process.env.DATABASE_URL ? {
    dialect: 'postgres',
    use_env_variable: 'DATABASE_URL',
    searchPath: 'public',
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
      freezeTableName: true,
      schema: 'public',
    },
    pool: {
      max: 20,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    logging: false,
    timezone: '-03:00',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      useUTC: false,
      dateStrings: true,
      typeCast: true,
    },
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
    migrationStorageTableSchema: 'public',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeds',
    seederStorageTableSchema: 'public',
  } : {
    dialect: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5433,
    username: process.env.DB_USERNAME || 'loadtech_admin',
    password: process.env.DB_PASSWORD || 'LoadTech@2025!',
    database: process.env.DB_DATABASE || 'loadtech_master',
    searchPath: 'public',
    define: {
      timestamps: true,
      underscored: true,
      underscoredAll: true,
      freezeTableName: true,
      schema: 'public',
    },
    pool: {
      max: 20,
      min: 0,
      acquire: 60000,
      idle: 10000,
    },
    logging: false,
    timezone: '-03:00',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      },
      useUTC: false,
      dateStrings: true,
      typeCast: true,
    },
    migrationStorage: 'sequelize',
    migrationStorageTableName: 'sequelize_meta',
    migrationStorageTableSchema: 'public',
    seederStorage: 'sequelize',
    seederStorageTableName: 'sequelize_seeds',
    seederStorageTableSchema: 'public',
  }
};
