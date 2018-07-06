import {DocumentNode} from 'graphql';
import {IResolvers} from "graphql-tools";

export type GQLResolver<Context, Result> = (parent: any, input: any, context: Context) => Promise<Result>;

export function module(item: any) {
}

export function required(target: Object, propertyKey: string, parameterIndex: number): void {
}

export interface GQLSchema {
    typeDefs: DocumentNode,
    resolvers: IResolvers
}

export interface GQLModule {
    name: string;
    members: Parameter[];
    resolvers: Resolver[];
}

export interface Parameter {
    index: number;
    isRequired: boolean;
    name: string;
    type: string;
}

export interface Resolver {
    name: string;
    parameters: Parameter[];
    returnType: string;
    f: GQLResolver<any, any>
}