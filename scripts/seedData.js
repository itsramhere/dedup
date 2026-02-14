"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../src/adapters/elasticsearch/client");
const faker_1 = require("@faker-js/faker");
const uuid_1 = require("uuid");
async function seed() {
    console.log("Starting Data Seeding...");
    const dataset = [];
    const BATCH_SIZE = 1000;
    console.log("Generating 900 unique users...");
    for (let i = 0; i < 900; i++) {
        dataset.push(generateFakeUser());
    }
    console.log("Generating 50 exact duplicates (Merge Targets)...");
    for (let i = 0; i < 25; i++) {
        const original = generateFakeUser();
        dataset.push(original);
        const duplicate = {
            ...original,
            user_id: (0, uuid_1.v4)(),
            name: original.name + " Jr",
            created_at: new Date().toISOString()
        };
        dataset.push(duplicate);
    }
    console.log("Generating 50 suspicious duplicates (Flag Targets)...");
    for (let i = 0; i < 25; i++) {
        const original = generateFakeUser();
        dataset.push(original);
        const duplicate = {
            ...original,
            user_id: (0, uuid_1.v4)(),
            email: faker_1.faker.internet.email(),
            created_at: new Date().toISOString()
        };
        dataset.push(duplicate);
    }
    console.log(`Bulk inserting ${dataset.length} users into Elasticsearch...`);
    const operations = dataset.flatMap(doc => [
        { index: { _index: 'users', _id: doc.user_id } },
        doc
    ]);
    const bulkResponse = await client_1.esClient.bulk({ refresh: true, operations });
    if (bulkResponse.errors) {
        console.error("❌ Bulk insert had errors!");
        console.log(JSON.stringify(bulkResponse.items[0], null, 2));
    }
    else {
        console.log(`Successfully inserted ${dataset.length} users!`);
    }
}
function generateFakeUser() {
    const firstName = faker_1.faker.person.firstName();
    const lastName = faker_1.faker.person.lastName();
    return {
        user_id: (0, uuid_1.v4)(),
        name: `${firstName} ${lastName}`,
        dob: faker_1.faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
        email: faker_1.faker.internet.email({ firstName, lastName }),
        phone_country_code: "+91",
        phone_number: faker_1.faker.string.numeric(10),
        house_no: faker_1.faker.location.buildingNumber(),
        address_line_1: faker_1.faker.location.street(),
        address_line_2: faker_1.faker.location.secondaryAddress(),
        city: "Vellore",
        state: "Tamil Nadu",
        country: "India",
        pin_code: faker_1.faker.location.zipCode(),
        address_raw: "",
        created_at: new Date().toISOString(),
        status: 'active'
    };
}
seed().catch(console.error);
