/*
 * Run using the mongo shell. For remote databases, ensure that the
 * connection string is supplied in the command line. For example:
 * localhost:
 *   mongo issuetracker C:\Users\zom\x1\api\script/init.js   mongo issuetracker C:\Users\zom\x1\api\script/generate_data.mongo.js
 * Atlas:
 *   mongo mongodb+srv://user:pwd@xxx.mongodb.net/issuetracker scripts/init.mongo.js
 * MLab:
 *   mongo mongodb://user:pwd@xxx.mlab.com:33533/issuetracker scripts/init.mongo.js
 */
//db.createCollection("issues");
//db.createCollection("deleted_issues");
db.issues.remove({});
db.deleted_issues.remove({});



const issuesDB = [
  {
    id:1,
    name:'Tuch',
    date:new Date('1999-12-19'),
    status:'New',
    description: 'Steps to recreate the problem:'
    + '\n1. Refresh the browser.'
    + '\n2. Select "New" in the filter'
    + '\n3. Refresh the browser again. Note the warning in the console:'
    + '\n   Warning: Hash history cannot PUSH the same path; a new entry'
    + '\n   will not be added to the history stack'
    + '\n4. Click on Add.'
    + '\n5. There is an error in console, and add doesn\'t work.',
    effort:5,
    },
    {  
    id:2,
    name:'Nattapon',
    date:new Date('2000-12-19'),
    status:'New',
    description: 'Steps to recreate the problem:'
    + '\n1. Refresh the browser.'
    + '\n2. Select "New" in the filter'
    + '\n3. Refresh the browser again. Note the warning in the console:'
    + '\n   Warning: Hash history cannot PUSH the same path; a new entry'
    + '\n   will not be added to the history stack'
    + '\n4. Click on Add.'
    + '\n5. There is an error in console, and add doesn\'t work.',
    effort:3,
    },
    {
    id:3,
    name:'Nattapon',
    date:new Date('2000-12-19'),
    status:'Assigned',
    description: 'There needs to be a border in the bottom in the panel'
    + ' that appears when clicking on Add',
    effort:3,
    },
];



db.issues.insertMany(issuesDB);
const count = db.issues.count();
print('Inserted', count, 'issues');

db.counters.remove({ _id: 'issues' });
db.counters.insert({ _id: 'issues', current: count });

db.issues.createIndex({ id: 1 }, { unique: true });
db.issues.createIndex({ status: 1 });
//db.issues.createIndex({ owner: 1 });
//db.issues.createIndex({ created: 1 });
db.issues.createIndex({ name: 'text', description: 'text' });
db.deleted_issues.createIndex({ id: 1 }, { unique: true });