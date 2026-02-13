import { esClient } from '../src/adapters/elasticsearch/client';
import { User } from '../src/types';
import { faker } from '@faker-js/faker';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    console.log("Starting Data Seeding...");

    const dataset: User[] = [];
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
            user_id: uuidv4(),
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
            user_id: uuidv4(),
            email: faker.internet.email(),
            created_at: new Date().toISOString()
        };
        dataset.push(duplicate);
    }

    console.log(`Bulk inserting ${dataset.length} users into Elasticsearch...`);
    
    const operations = dataset.flatMap(doc => [
        { index: { _index: 'users', _id: doc.user_id } },
        doc
    ]);

    const bulkResponse = await esClient.bulk({ refresh: true, operations });

    if (bulkResponse.errors) {
        console.error("❌ Bulk insert had errors!");
        console.log(JSON.stringify(bulkResponse.items[0], null, 2));
    } else {
        console.log(`Successfully inserted ${dataset.length} users!`);
    }
}

function generateFakeUser(): User {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    
    return {
        user_id: uuidv4(),
        name: `${firstName} ${lastName}`,
        dob: faker.date.birthdate({ min: 18, max: 65, mode: 'age' }).toISOString().split('T')[0],
        email: faker.internet.email({ firstName, lastName }),
        phone_country_code: "+91",
        phone_number: faker.string.numeric(10),
        house_no: faker.location.buildingNumber(),
        address_line_1: faker.location.street(),
        address_line_2: faker.location.secondaryAddress(),
        city: "Vellore",
        state: "Tamil Nadu",
        country: "India",
        pin_code: faker.location.zipCode(),
        address_raw: "", 
        created_at: new Date().toISOString(),
        status: 'active'
    };
}

seed().catch(console.error);