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
import { ApiService } from './services/api.service';
import { SuggestionPanel } from './services/suggestion-panel';
import { CommitAnalysisService } from './services/commit-analysis.service';

export function activate(context: vscode.ExtensionContext) {
    // Create a dedicated output channel so logs are always visible
    const outputChannel = vscode.window.createOutputChannel('CommitMate');
    context.subscriptions.push(outputChannel);

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
                const isGitRepo = await gitService.isGitRepository();

                if (!isGitRepo) {
                    vscode.window.showErrorMessage(
                        'CommitMate: This workspace is not a Git repository.'
                    );
                    return;
                }

                const hasChanges = await gitService.hasChanges();

                if (!hasChanges) {
                    vscode.window.showInformationMessage(
                        'CommitMate: No Git changes detected.'
                    );
                    return;
                }

                const stagedDiff = await gitService.getStagedDiff();
                const unstagedDiff = await gitService.getUnstagedDiff();

                if (!stagedDiff) {
                    // Show the panel with an empty state so users understand what's missing
                    const analysisService = new CommitAnalysisService();
                    const analysis = analysisService.analyzeDiff('');

                    SuggestionPanel.createOrShow({
                        title: '',
                        description: []
                    }, stagedDiff, analysis, 'empty');

                    return;
                }

                const analysisService = new CommitAnalysisService();

                const analysis = analysisService.analyzeDiff(stagedDiff);

                outputChannel.appendLine('=== COMMIT ANALYSIS ===');
                outputChannel.appendLine(`Files changed: ${analysis.filesChanged}`);
                outputChannel.appendLine(`Lines added: ${analysis.linesAdded}`);
                outputChannel.appendLine(`Lines removed: ${analysis.linesRemoved}`);
                outputChannel.appendLine(`Total changed lines: ${analysis.totalChangedLines}`);
                outputChannel.appendLine(`Large commit: ${analysis.isLarge}`);
                outputChannel.appendLine('');

                const apiService = new ApiService();

                let result;

                try {
                    result = await apiService.generateCommit(stagedDiff);

                    SuggestionPanel.createOrShow({
                        title: result.title,
                        description: result.description,
                    }, stagedDiff, analysis, 'ready');
                } catch (err) {
                    const message = err instanceof Error ? err.message : String(err);

                    outputChannel.appendLine('CommitMate generate error: ' + message);
                    outputChannel.show(true);

                    SuggestionPanel.createOrShow({
                        title: '',
                        description: []
                    }, stagedDiff, analysis, 'error', message);
                }
            } catch (error) {
                outputChannel.appendLine('CommitMate error: ' + (error instanceof Error ? error.message : String(error)));
                outputChannel.show(true);

                vscode.window.showErrorMessage(
                    'CommitMate: Failed to generate commit suggestion.'
                );
            }
        }
    );

    context.subscriptions.push(disposable);
}

export function deactivate() {}