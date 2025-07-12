/**
 * Script para debugar o problema de criação de cliente Asaas
 */

// Simular dados de um usuário típico
const testPayload = {
    cpfCnpj: "12345678901",
    phone: "1133334444",
    mobilePhone: "11987654321",
    address: "Rua Teste",
    addressNumber: "123",
    complement: "Apto 1",
    province: "Centro",
    postalCode: "01000-000",
    city: "São Paulo",
    state: "SP"
};

// Simular dados do usuário do banco
const userData = {
    id: 1,
    nome: "João Silva",
    email: "joao@teste.com",
    status: "ativo",
    asaas_customer_id: null
};

console.log("=== DADOS DO USUÁRIO ===");
console.log(userData);

console.log("\n=== PAYLOAD RECEBIDO ===");
console.log(testPayload);

// Simular o que acontece no PaymentController
const customerData = {
    name: userData.nome, // required
    cpfCnpj: testPayload.cpfCnpj, // required
    email: userData.email,
    phone: testPayload.phone,
    mobilePhone: testPayload.mobilePhone,
    address: testPayload.address,
    addressNumber: testPayload.addressNumber,
    complement: testPayload.complement,
    province: testPayload.province,
    postalCode: testPayload.postalCode,
    city: testPayload.city,
    state: testPayload.state,
    externalReference: userData.id.toString(),
    notificationDisabled: false,
    additionalEmails: testPayload.additionalEmails,
    municipalInscription: testPayload.municipalInscription,
    stateInscription: testPayload.stateInscription,
    observations: testPayload.observations,
    groupName: testPayload.groupName,
    company: testPayload.company,
    foreignCustomer: testPayload.foreignCustomer || false
};

console.log("\n=== DADOS MONTADOS PARA ASAAS ===");
console.log(customerData);

// Remover campos undefined
Object.keys(customerData).forEach(key => {
    if (customerData[key] === undefined) {
        delete customerData[key];
    }
});

console.log("\n=== DADOS LIMPOS (SEM UNDEFINED) ===");
console.log(customerData);

// Verificar campos obrigatórios do Asaas
const requiredFields = ['name', 'cpfCnpj', 'email'];
const missingFields = requiredFields.filter(field => !customerData[field]);

if (missingFields.length > 0) {
    console.log("\n❌ CAMPOS OBRIGATÓRIOS FALTANDO:");
    console.log(missingFields);
} else {
    console.log("\n✅ TODOS OS CAMPOS OBRIGATÓRIOS PRESENTES");
}

// Verificar se há campos vazios ou inválidos
const emptyFields = Object.entries(customerData)
    .filter(([key, value]) => value === '' || value === null)
    .map(([key]) => key);

if (emptyFields.length > 0) {
    console.log("\n⚠️ CAMPOS VAZIOS ENCONTRADOS:");
    console.log(emptyFields);
}

console.log("\n=== SIMULAÇÃO DO PAYLOAD PARA ASAAS ===");
console.log(JSON.stringify(customerData, null, 2));
