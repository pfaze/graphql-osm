import {scanForModules} from './module-scanner';
import {GQLModule, GQLSchema, Parameter} from './graphql-modules';
import {writeFile} from 'fs';
import {sep} from 'path';
import {gql} from 'apollo-server';

interface SchemaFragment {
    types: string,
    resolvers: any;
}

function parseParameter(parameter: Parameter): string {
    return `${parameter.name}: ${parameter.type}${parameter.isRequired ? '!' : ''}`;
}

function moduleToSchemaFragment(module: GQLModule): SchemaFragment {
    let fragment = `type ${module.name} {`;
    const resolvers = {};
    if (module.members.length > 0) {
        module.members.forEach((member) => {
            fragment = fragment.concat(`\n\t${parseParameter(member)}`);
        });
        fragment = fragment.concat('\n');
    }
    if (module.resolvers.length > 0 && module.members.length > 0) {
        fragment = fragment.concat('\n')
    }
    if (module.resolvers.length > 0) {
        if(module.members.length === 0) {
            fragment = fragment.concat('\n');
        }
        module.resolvers.forEach((resolver) => {
            if (resolver.f !== null) {
                resolvers[module.name] = {};
                resolvers[module.name][resolver.name] = resolver.f;
            }
            fragment = fragment.concat(`\t${resolver.name}`);
            if (resolver.parameters.length > 0) {
                fragment = fragment.concat(`(`);
                resolver.parameters.forEach((param, i) => {
                    fragment = fragment.concat(parseParameter(param))
                    if (i < resolver.parameters.length - 1) {
                        fragment = fragment.concat(', ')
                    }
                });
                fragment = fragment.concat(`)`)
            }
            fragment = fragment.concat(`: ${resolver.returnType}`);
        })
    }
    return {
        types: fragment.concat('\n}'),
        resolvers
    }
}

export function generateSchema(moduleDir: string, recursive: boolean = true, persist: boolean = false): GQLSchema {
    const modules = scanForModules(moduleDir, recursive);
    if (modules.length === 0) {
        throw new Error(`No GraphQL modules located in provided module dir [${moduleDir}, recursive search = ${recursive}]`);
    }
    let types = '';
    const resolvers = [];
    modules.map(moduleToSchemaFragment).forEach((fragment) => {
        types = types.concat(fragment.types).concat('\n');
        resolvers.push(fragment.resolvers);
    });
    if (persist) {
        writeFile(process.env.PWD.concat(sep).concat('schema.generated.gql'), types, (error): void => {
            if (error) {
                console.error(`Unable to persist schema to disk ${error}`);
            }
        })
    }
    let mergedResolvers = {};
    resolvers.forEach(resolver => mergedResolvers = Object.assign(mergedResolvers, resolver))
    return {
        typeDefs: gql(types),
        resolvers: mergedResolvers
    }
}