
const express = require('express');
const { UserInputError } = require('apollo-server-express');
const { connectToDb,getNextSequence,getdb } = require('./db.js');
const { startApolloServer } = require('./grapql.js');
require('isomorphic-fetch');
require('dotenv').config({ path: './sample.env' });
const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');

/*
const innitaldb = [
  {
   id:1,
   name:'Tuch',
   date:new Date('1999-12-19'),
   },
   {  
   id:2,
   name:'Nattapon',
   date:new Date('2000-12-19'),
   },
   {
   id:3,
   name:'Nattapon',
   date:new Date('2000-12-19'),
   },
];
*/
const GraphQLDate = new GraphQLScalarType({
  name: 'GraphQLDate',
  description: 'A Date() type in GraphQL as a scalar',
  
  serialize(value) {
    return value.toString();
  },
  
  parseValue(value) {
    const dateValue = new Date(value);
    return Number.isNaN(dateValue.getTime()) ? undefined : dateValue;
  },
  parseLiteral(ast) {
    if (ast.kind == Kind.STRING) {
      const value = new Date(ast.value);
      return Number.isNaN(value.getTime()) ? undefined : value;
      
    }
      return undefined;
  },
});

const PAGE_SIZE = 10;


const typeDefs =`
scalar GraphQLDate
enum StatusType {
  New
  Assigned
  Fixed
  Closed
}
type Issue {
  _id: ID!
  id: Int!
  name: String!
  date: GraphQLDate
  status: StatusType!
  description: String
  effort: Int
}
type IssueCounts {
  name: String!
  New: Int
  Assigned: Int
  Fixed: Int
  Closed: Int
}
type IssueListWithPages {
  issues: [Issue!]!
  pages: Int
}

input IssueInputs {
   name: String
   date: GraphQLDate
   status: StatusType =  Assigned
   description: String
   effort:Int 
}
input IssueUpdateInputs {
  name: String
  date: GraphQLDate
  status: StatusType
  description: String
  effort: Int
}
type Query {
  about: String
  List:[Issue!]!
  issue(id: Int!): Issue!
  issueCounts(status: StatusType effortMin: Int effortMax: Int): [IssueCounts!]!
  issueList( status: StatusType effortMin: Int effortMax: Int search: String page: Int = 1): IssueListWithPages
}
type Mutation{
  setMessage(message :String):String
  UpdateList(id: Int!, changes: IssueUpdateInputs!): Issue!
  AddList(issue: IssueInputs!): Issue!
  DeleteList(id: Int!): Boolean!
  issueRestore(id: Int!): Boolean!
}`;

// The root provides a resolver function for each API endpoint
const resolvers = {
Query:{
 about, 
 List,
 issue,
 issueCounts,
 issueList,
},
Mutation:{
 setMessage,
 AddList,
 UpdateList,
 DeleteList,
 issueRestore,
},
GraphQLDate,
};


let aboutMessage = 'Issue Tracker API v1.0';
async function setMessage(_, { message }) {
  aboutMessage = message;
  return aboutMessage;
}

async function about() {
  return aboutMessage;
}


async function issueRestore(_, { id }) {
  const db = getdb();
  const issue = await db.collection('deleted_issues').findOne({ id });
  if (!issue) return false;
     issue.deleted = new Date();

  let result = await db.collection('issues').insertOne(issue);
  if (result.insertedId) {
    result = await db.collection('deleted_issues').deleteOne({ id });
    return result.deletedCount === 1;
  }
  return false;
}


async function issueList(_, {status, effortMin, effortMax, search, page,}) {
  const db = getdb();
  const filter = {};

  if (status) filter.status = status;

  if (effortMin !== undefined || effortMax !== undefined) {
    filter.effort = {};
    if (effortMin !== undefined) filter.effort.$gte = effortMin;
    if (effortMax !== undefined) filter.effort.$lte = effortMax;
  }
  if (search) 
     filter.$text = { $search: search, $caseSensitive: false };

  const cursor = db.collection('issues').find(filter).sort({ id: 1 }).skip(PAGE_SIZE * (page - 1)).limit(PAGE_SIZE);
  const totalCount = await db.collection('issues').find(filter).sort({ id: 1 }).count();
  const issues = cursor.toArray();
  const pages = Math.ceil(totalCount / PAGE_SIZE);
  return { issues, pages };
}


async function issueCounts(_, { status, effortMin, effortMax }) {
  const db = getdb();
  const filter = {};

  if (status) filter.status = status;

  if (effortMin !== undefined || effortMax !== undefined) {
    filter.effort = {};
    if (effortMin !== undefined) filter.effort.$gte = effortMin;
    if (effortMax !== undefined) filter.effort.$lte = effortMax;
  }

  const results = await db.collection('issues').aggregate([
    { $match: filter },
    {
      $group: {
        _id: { name: '$name', status: '$status' },
        count: { $sum: 1 },
      },
    },
  ]).toArray();

  const stats = {};
  results.forEach((result) => {
    // eslint-disable-next-line no-underscore-dangle
    const { name, status: statusKey } = result._id;
    if (!stats[name]) 
        stats[name] = { name };
    stats[name][statusKey] = result.count;
  });
  return Object.values(stats);
}


async function DeleteList(_, { id }) {
  const db = getdb();
  const issue = await db.collection('issues').findOne({ id });
  if (!issue) 
     return false;
  issue.deleted = new Date();
  let result = await db.collection('deleted_issues').insertOne(issue);
  if (result.insertedId) {
     result = await db.collection('issues').deleteOne({ id });
     return result.deletedCount === 1;
  }
  return false;
 }

async function  UpdateList(_, { id, changes }) {
  const db = getdb();
  if (changes.name || changes.status ) {
  const issue = await db.collection('issues').findOne({ id });
  Object.assign(issue, changes);
  issueValidate(issue);
  }
  await db.collection('issues').updateOne({ id }, { $set: changes });
  const savedIssue = await db.collection('issues').findOne({ id });
  return savedIssue;
 }

function issueValidate(issue) {
  const errors = [];
  if (issue.name.length < 3) {
    errors.push('Field Nmae must be at least 3 characters long.');
  }
  if (errors.length > 0) {
    throw new UserInputError('Invalid input(s)', { errors });
  }
}


async function issue(_, { id }) {
  const db = getdb();
  const issue = await db.collection('issues').findOne({ id });
  return issue;
}

async function AddList(_, { issue }) {
  issueValidate(issue);
  const db = getdb();
  issue.date = new Date();
  issue.id = await getNextSequence('issues');
  issue.effort = 0;
  const result = await db.collection('issues').insertOne(issue);
  const savedIssue = await db.collection('issues').findOne({ _id: result.insertedId });
  return savedIssue;
 }

 async function List() {
  const db = getdb();
  const issues = await db.collection('issues').find({}).toArray(); ;
  return issues;
}



const app = express();

startApolloServer(typeDefs, resolvers,app);
const port = Number.parseInt(process.env.PORT) || 4000;

(async function start() {
  try {
    await connectToDb();
    
    app.listen(port, () => {
      console.log(`API server started on port ${port}`);
    });
  } catch (err) {
    console.log('ERROR:', err);
  }
}());
















