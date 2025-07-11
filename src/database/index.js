import { Sequelize } from 'sequelize';

import configDatabase from '../config/database.js';

// Importar todos os models
import User from '../app/models/User.js';
import Plano from '../app/models/Plano.js';
import Assinatura from '../app/models/Assinatura.js';
import Loja from '../app/models/Loja.js';
import Pagamento from '../app/models/Pagamento.js';

const models = [User, Plano, Assinatura, Loja, Pagamento];

class Database {
  constructor() {
    this.init();
  }

  init() {
    this.connection = new Sequelize(configDatabase);

    models.forEach((model) => model.init(this.connection)); // ✅ inicializa todos
    models.forEach((model) => {
      if (model.associate) {
        model.associate(this.connection.models); // ✅ define relacionamentos
      }
    });
  }
}

export default new Database();
