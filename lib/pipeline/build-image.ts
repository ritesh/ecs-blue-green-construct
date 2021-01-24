import * as cdk from "@aws-cdk/core";
import {CfnOutput} from "@aws-cdk/core";
import {Repository} from "@aws-cdk/aws-ecr";
import {Role} from "@aws-cdk/aws-iam";
import {BuildEnvironmentVariableType, ComputeType, Project} from "@aws-cdk/aws-codebuild";
import ecr = require("@aws-cdk/aws-ecr");
import codeCommit = require('@aws-cdk/aws-codecommit');
import codeBuild = require("@aws-cdk/aws-codebuild");
import secretsManager = require("@aws-cdk/aws-secretsmanager");


export interface EcsBlueGreenBuildImageProps {
    readonly codeRepoName?: string;
    readonly codeRepoDesc?: string;
    readonly ecsTaskRole?: Role;
    readonly codeBuildRole?: Role;
    readonly dockerHubUsername?: string;
    readonly dockerHubPassword?: string;
}

export class EcsBlueGreenBuildImage extends cdk.Construct {

    public readonly ecrRepo: Repository;
    public readonly codeBuildProject: Project;

    constructor(scope: cdk.Construct, id: string, props: EcsBlueGreenBuildImageProps = {}) {
        super(scope, id);

        // ECR repository for the docker images
        this.ecrRepo = new ecr.Repository(this, 'ecrRepo', {
            imageScanOnPush: true
        });

        // CodeCommit repository for storing the source code
        const codeRepo = new codeCommit.Repository(this, "codeRepo", {
            repositoryName: props.codeRepoName!,
            description: props.codeRepoDesc!
        });

        // Create the secrets manager for storing DockerHub login
        const dockerHubSecret = new secretsManager.CfnSecret(this, 'dockerHubSecret', {
            secretString: JSON.stringify({
                username: props.dockerHubUsername,
                password: props.dockerHubPassword
            }),
            description: "DockerHub secrets for CodeBuild"
        });


        // Creating the code build project
        this.codeBuildProject = new codeBuild.Project(this, "codeBuild", {
            role: props.codeBuildRole,
            description: "Code build project for the application",
            environment: {
                buildImage: codeBuild.LinuxBuildImage.STANDARD_4_0,
                computeType: ComputeType.SMALL,
                privileged: true,
                environmentVariables: {
                    REPOSITORY_URI: {
                        value: this.ecrRepo.repositoryUri,
                        type: BuildEnvironmentVariableType.PLAINTEXT
                    },
                    TASK_EXECUTION_ARN: {
                        value: props.ecsTaskRole!.roleArn,
                        type: BuildEnvironmentVariableType.PLAINTEXT
                    },
                    DOCKER_HUB_SECRET_ARN: {
                        value: dockerHubSecret.ref,
                        type: BuildEnvironmentVariableType.PLAINTEXT
                    }
                }
            },
            source: codeBuild.Source.codeCommit({
                repository: codeRepo
            })
        });

        // Export the outputs
        new CfnOutput(this, "codeRepoName", {
            description: "CodeCommit repository name",
            exportName: "repositoryName",
            value: codeRepo.repositoryName
        });
        new CfnOutput(this, "ecrRepoName", {
            description: "ECR repository name",
            exportName: "ecrRepoName",
            value: this.ecrRepo.repositoryName
        });
        new CfnOutput(this, "codeBuildProjectName", {
            description: "CodeBuild project name",
            exportName: "codeBuildProjectName",
            value: this.codeBuildProject.projectName
        });
        new CfnOutput(this, "ecsTaskRoleArn", {
            description: "ECS task role arn",
            exportName: "ecsTaskRoleArn",
            value: props.ecsTaskRole?.roleArn!
        });
        new CfnOutput(this, "codeRepoCloneURL", {
            description: "CodeCommit repository clone URL",
            exportName: "repositoryCloneUrlHttp",
            value: codeRepo.repositoryCloneUrlHttp
        });
    }
}
