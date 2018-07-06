import {readdirSync, statSync} from 'fs';
import {GQLModule, GQLResolver, Parameter, Resolver} from './graphql-modules'
import Project, {ParameterDeclaration} from 'ts-simple-ast';

const project = new Project();

function upFirstCharacter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getParameters(params: ParameterDeclaration[]): Parameter[] {
    return params.map((param, i) => {
        return {
            index: i,
            name: param.getName(),
            type: param.getType().getText() === 'number' ? 'Int' : upFirstCharacter(param.getType().getText()),
            isRequired: param.getDecorator('required') ? true : false
        }
    });
}

function findModules(dir: string,
                     recursive: boolean = true,
                     nested: boolean = false,
                     modules: GQLModule[] = []): GQLModule[] {
    readdirSync(dir).forEach((resource) => {
        if (recursive && statSync(dir.concat('/').concat(resource)).isDirectory()) {
            return findModules(resource, recursive, true, modules);
        }
        const requireModule = require(dir.concat('/').concat(resource));
        project.addExistingSourceFile(dir.concat('/').concat(resource));
        const sourceFile = project.getSourceFileOrThrow(resource);
        const exportedClasses = sourceFile.getClasses();
        exportedClasses.forEach((classDeclaration) => {
            if (classDeclaration.getDecorator('module')) {
                const instance = new requireModule[classDeclaration.getName()]();
                const constructorDeclaration = classDeclaration.getConstructors();
                const members: Parameter[] = [];
                const resolvers: Resolver[] = [];
                if (constructorDeclaration.length === 1 && constructorDeclaration[0].getParameters().length > 0) {
                    getParameters(constructorDeclaration[0].getParameters()).forEach((m) => members.push(m));
                }
                if (classDeclaration.getInstanceMethods().length > 0) {
                    classDeclaration.getInstanceMethods().forEach((method) => {
                        if (method.getReturnType().getAliasSymbol().getName() === 'GQLResolver') {
                            const returnType = method.getReturnType().getAliasTypeArguments()[1];
                            let returnTypeName = upFirstCharacter(returnType.getSymbol().getName());
                            const parameters: Parameter[] = getParameters(method.getParameters());
                            if (returnType.isArray()) {
                                const arrayType = returnType.getArrayType().getText();
                                returnTypeName = `[${upFirstCharacter(arrayType.substring(arrayType.lastIndexOf('.') + 1, arrayType.length))}]`;
                            }
                            resolvers.push({
                                name: method.getName(),
                                parameters,
                                returnType: returnTypeName,
                                f: instance[method.getName()]()
                            })
                        }
                    });
                }
                modules.push({
                    name: classDeclaration.getName(),
                    members,
                    resolvers,
                });
            }
        })
    });
    return modules;
}

export function scanForModules(dir: string, recursive: boolean = true): GQLModule[] {
    return findModules(dir, recursive);
}

