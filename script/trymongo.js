/* test mongo example collection employee-- Node trymongo  */

const {MongoClient} = require('mongodb');
require('dotenv').config({path: './sample.env'});

const url = process.env.DB_URL || 'mongodb://localhost/issuetracker';
const client = new MongoClient(url, { useNewUrlParser: true });

async function testWithAsync() {

try{
    await client.connect();
    const db =  client.db();
    console.log('TEST Connect success');
    const collections = db.collection('employees');

    const employee = { id:1 , name: 'A. Callback', age: 23 };
    const result = await collections.insertOne(employee);
    console.log('TEST INSERT :\n',result.insertedId);
    const docs  = await collections.find({ _id: result.insertedId}).toArray();
    console.log('Result of find:\n', docs);
}finally{
    await client.close();
}


}

testWithAsync().catch(console.dir);


