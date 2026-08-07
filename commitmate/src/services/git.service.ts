import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GitService {
    private readonly repositoryPath: string;

    constructor(repositoryPath: string) {
        this.repositoryPath = repositoryPath;
    }

    async getStagedDiff(): Promise<string> {
        const { stdout } = await execAsync(
            'git diff --cached',
            {
                cwd: this.repositoryPath
            }
        );

        return stdout;
    }

    async getUnstagedDiff(): Promise<string> {
        const { stdout } = await execAsync(
            'git diff',
            {
                cwd: this.repositoryPath
            }
        );

        return stdout;
    }

    async hasChanges(): Promise<boolean> {
        const { stdout } = await execAsync(
            'git status --porcelain',
            {
                cwd: this.repositoryPath
            }
        );

        return stdout.trim().length > 0;
    }
}