# graphql-osm

<span style="color:red">WARNING: Module not production ready yet!</span>

This module is still under heavy construction, any feedback will be appreciated!

## About

graphql-osm (Object to Schema Mapping) is a utility build on top of [apollo-tools](https://www.apollographql.com/docs/graphql-tools/) and [apollo-server](https://www.apollographql.com/docs/apollo-server/v2/getting-started.html).

It assist developers by generating the required schema from the domain objects, and thus also keeping
it up to date automatically whenever the domain objects change.

At this moment it is a very experimental library that still requires allot of work to complete, it also only supports 
a small subset of all the schema options available.

## Installation

```
$ npm install graphql-osm --save
```

**Important! graphql-osm requires TypeScript >= 2.0 and the experimentalDecorators, emitDecoratorMetadata compilation options in your tsconfig.json file.**

## Example

```typescript
import * as express from 'express';
const {ApolloServer} = require('apollo-server-express');
import {required, module, GQLResolver, generateSchema} from 'graphql-osm';

@module
export class Query {

    sayHello(@required name: string, age: number): GQLResolver<any, Person> {
        return (target, args, ctx) => {
            const message = args.age ? `Hi ${args.name}, ${args.age} is a wonderful age!` : `Hi ${args.name}`;
            return Promise.resolve(new Person(message, args.age));
        }
    }

}

@module
export class Person {
    
    constructor(@required public message: string, public age: number){}
    
}

const app = express();
const schema = generateSchema(process.env.PWD.concat('<the folder containing the modules>'))
const server = new ApolloServer(schema);
server.applyMiddleware({app});
app.listen({port: 3000}, () =>
    console.log(`🚀 Server ready at http://localhost:3000${server.graphqlPath}`)
);
```
