#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import {CfnParameter, Construct, StackProps} from '@aws-cdk/core';
import * as EcsBlueGreen from "../lib";

export class BlueGreenContainerImageStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Defining the CFN input parameters
        const codeRepoDesc = new CfnParameter(this, "codeRepoDesc", {
            type: "String",
            description: "CodeCommit repository description for the ECS service",
            default: "Source code for the application"
        });

        // Build the stack
        const ecsBlueGreenRoles = new EcsBlueGreen.EcsBlueGreenRoles(this, 'EcsBlueGreenRoles');
        new EcsBlueGreen.EcsBlueGreenBuildImage(this, 'EcsBlueGreenBuildImage', {
            codeBuildRole: ecsBlueGreenRoles.codeBuildRole,
            ecsTaskRole: ecsBlueGreenRoles.ecsTaskRole,
            codeRepoName: process.env.CODE_REPO_NAME,
            codeRepoDesc: codeRepoDesc.valueAsString,
            dockerHubUsername: process.env.DOCKERHUB_USERNAME,
            dockerHubPassword: process.env.DOCKERHUB_PASSWORD
        });

    }

}

const app = new cdk.App();
new BlueGreenContainerImageStack(app, 'BlueGreenContainerImageStack');
