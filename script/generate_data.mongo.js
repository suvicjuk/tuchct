/* global db print */
/* eslint no-restricted-globals: "off" */

const owners = ['Ravan', 'Eddie', 'Pieta', 'Parvati', 'Victor'];
const statuses = ['New', 'Assigned', 'Fixed', 'Closed'];

const initialCount = db.issues.count();

for (let i = 0; i < 100; i += 1) {
  const randomCreatedDate = (new Date())-Math.floor(Math.random() * 60) * 1000 * 60 * 60 * 24;
  const date = new Date(randomCreatedDate);
  const status = statuses[Math.floor(Math.random() * 4)];
  const effort = Math.ceil(Math.random() * 20);
  const name = owners[Math.floor(Math.random() * 5)];
  const id = initialCount + i + 1;
  const issue = {
    id, name, date, status, effort,
  };
  db.issues.insertOne(issue);
}

const count = db.issues.count();
db.counters.update({ _id: 'issues' }, { $set: { current: count } });

print('New issue count:', count);
