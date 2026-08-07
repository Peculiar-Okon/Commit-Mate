// // The module 'vscode' contains the VS Code extensibility API
// // Import the module and reference it with the alias vscode in your code below
// import * as vscode from 'vscode';

// // This method is called when your extension is activated
// // Your extension is activated the very first time the command is executed
// export function activate(context: vscode.ExtensionContext) {

// 	// Use the console to output diagnostic information (console.log) and errors (console.error)
// 	// This line of code will only be executed once when your extension is activated
// 	console.log('CommitMate extension activated');

// 	// The command has been defined in the package.json file
// 	// Now provide the implementation of the command with registerCommand
// 	// The commandId parameter must match the command field in package.json
// 	const disposable = vscode.commands.registerCommand('commitmate.generateCommit', () => {
// 		// The code you place here will be executed every time your command is executed
// 		// Display a message box to the user
// 		vscode.window.showInformationMessage('CommitMate is ready to generate your commit!');
// 	});

// 	context.subscriptions.push(disposable);
// }

// // This method is called when your extension is deactivated
// export function deactivate() {}

import * as vscode from 'vscode';
import { GitService } from './services/git.service';

export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand(
        'commitmate.generateCommit',
        async () => {
            const workspaceFolder =
                vscode.workspace.workspaceFolders?.[0];

            if (!workspaceFolder) {
                vscode.window.showErrorMessage(
                    'CommitMate: No workspace is open.'
                );
                return;
            }

            const repositoryPath = workspaceFolder.uri.fsPath;

            const gitService = new GitService(repositoryPath);

            try {
                const hasChanges = await gitService.hasChanges();

                if (!hasChanges) {
                    vscode.window.showInformationMessage(
                        'CommitMate: No Git changes detected.'
                    );
                    return;
                }

                const stagedDiff = await gitService.getStagedDiff();
                const unstagedDiff = await gitService.getUnstagedDiff();

                console.log('=== STAGED DIFF ===');
                console.log(stagedDiff);

                console.log('=== UNSTAGED DIFF ===');
                console.log(unstagedDiff);

                vscode.window.showInformationMessage(
                    'CommitMate: Git changes detected.'
                );
            } catch (error) {
                console.error('CommitMate Git error:', error);

                vscode.window.showErrorMessage(
                    'CommitMate: Failed to read Git changes.'
                );
            }
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}