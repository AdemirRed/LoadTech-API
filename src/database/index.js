import { Sequelize } from 'sequelize';

import configDatabase from '../config/database';

// Importar todos os models
import User from '../app/models/User';
import Plano from '../app/models/Plano';
import Assinatura from '../app/models/Assinatura';
import Loja from '../app/models/Loja';
import Pagamento from '../app/models/Pagamento';

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
