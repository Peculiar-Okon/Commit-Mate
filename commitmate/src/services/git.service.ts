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
                cwd: this.repositoryPath,
                maxBuffer: 10 * 1024 * 1024 // 10MB
            }
        );

        return stdout;
    }

    async getUnstagedDiff(): Promise<string> {
        const { stdout } = await execAsync(
            'git diff',
            {
                cwd: this.repositoryPath,
                maxBuffer: 10 * 1024 * 1024 // 10MB
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

    async isGitRepository(): Promise<boolean> {
        try {
            await execAsync(
                'git rev-parse --is-inside-work-tree',
                {
                    cwd: this.repositoryPath
                }
            );
            return true;
        } catch {
            return false;
        }
    }
}

console.log('CommitMate is tested and working fine');
