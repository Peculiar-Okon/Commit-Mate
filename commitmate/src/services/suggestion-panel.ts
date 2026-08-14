import * as vscode from 'vscode';
import { ApiService } from './api.service';
import { GitService } from './git.service';
import { CommitSizeAnalysis } from './commit-analysis.service';

export interface CommitSuggestion {
    title: string;
    description: string[];
}

export class SuggestionPanel {
    public static currentPanel: SuggestionPanel | undefined;

    private readonly panel: vscode.WebviewPanel;
    private suggestion: CommitSuggestion;
    private readonly stagedDiff: string;
    private readonly analysis: CommitSizeAnalysis;
    private editing: boolean = false;
    private state: 'ready' | 'empty' | 'error' = 'ready';
    private errorMessage?: string;

    private constructor(
        panel: vscode.WebviewPanel,
        suggestion: CommitSuggestion,
        stagedDiff: string,
        analysis: CommitSizeAnalysis,
        state: 'ready' | 'empty' | 'error' = 'ready',
        errorMessage?: string
    ) {
        this.panel = panel;
        this.suggestion = suggestion;
        this.stagedDiff = stagedDiff;
        this.analysis = analysis;
        this.state = state;
        this.errorMessage = errorMessage;

        this.panel.webview.html =
            this.getHtmlContent();

        this.panel.webview.onDidReceiveMessage(
            async (message) => {
                switch (message.command) {
                    case 'copy':
                        await this.copySuggestion();
                        break;
                    case 'edit':
                        this.enableEditing();
                        break;
                    case 'save':
                        this.saveEditedSuggestion(message);
                        break;
                    case 'cancel':
                        this.disableEditing();
                        break;
                    case 'regenerate':
                        await this.regenerateSuggestion();
                        break;
                    case 'accept':
                        await this.acceptSuggestion();
                        break;
                }
            }
        );

        this.panel.onDidDispose(() => {
            SuggestionPanel.currentPanel = undefined;
        });
    }

    public static createOrShow(
        suggestion: CommitSuggestion,
        stagedDiff: string,
        analysis: CommitSizeAnalysis
    , state: 'ready' | 'empty' | 'error' = 'ready', errorMessage?: string): void {

        if (SuggestionPanel.currentPanel) {
            SuggestionPanel.currentPanel.panel.reveal(
                vscode.ViewColumn.Beside
            );

            SuggestionPanel.currentPanel.suggestion = suggestion;
            SuggestionPanel.currentPanel.editing = false;

            SuggestionPanel.currentPanel.state = state;
            SuggestionPanel.currentPanel.errorMessage = errorMessage;

            SuggestionPanel.currentPanel.panel.webview.html = SuggestionPanel.currentPanel.getHtmlContent();

            return;
        }

        const panel = vscode.window.createWebviewPanel(
            'commitmateSuggestion',
            'CommitMate Suggestion',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true
            }
        );

        SuggestionPanel.currentPanel = new SuggestionPanel(panel, suggestion, stagedDiff, analysis, state, errorMessage);
    }

    private getHtmlContent(): string {
        const description = this.suggestion.description
            .map(item => `<li>${this.escapeHtml(item)}</li>`)
            .join('');

        const titleDisplay = this.editing
            ? `<input id="commitTitle" class="edit-input" value="${this.escapeHtml(this.suggestion.title)}" />`
            : `<div class="commit-title">${this.escapeHtml(this.suggestion.title)}</div>`;

        const descriptionDisplay = this.editing
            ? `<textarea id="description" class="edit-textarea">${this.escapeHtml(this.suggestion.description.join('\n'))}</textarea>`
            : `<div class="description"><ul>${description}</ul></div>`;

        const analysisSection = `
            <div class="section analysis-section">

                <div class="label">
                    Commit Analysis
                </div>

                <div class="analysis-box ${this.analysis.isLarge ? 'large' : ''}">

                    ${this.analysis.isLarge ? `
                        <div class="analysis-warning">
                            <span class="warning-icon" aria-hidden="true">⚠</span>
                            Large commit detected
                        </div>
                    ` : ''}

                    <div class="analysis-grid">
                        <div class="analysis-item">
                            <span class="analysis-value">${this.analysis.filesChanged}</span>
                            <span class="analysis-key">Files changed</span>
                        </div>
                        <div class="analysis-item">
                            <span class="analysis-value">${this.analysis.linesAdded}</span>
                            <span class="analysis-key">Lines added</span>
                        </div>
                        <div class="analysis-item">
                            <span class="analysis-value">${this.analysis.linesRemoved}</span>
                            <span class="analysis-key">Lines removed</span>
                        </div>
                        <div class="analysis-item">
                            <span class="analysis-value">${this.analysis.totalChangedLines}</span>
                            <span class="analysis-key">Total changed</span>
                        </div>
                    </div>

                    ${this.analysis.isLarge ? `
                        <div class="analysis-tip">
                            Consider splitting this commit into smaller logical changes.
                        </div>
                    ` : ''}

                </div>

            </div>
        `;

        const actions = this.editing
            ? `
                <div class="actions" aria-label="Editing actions">
                    <button id="save" class="icon-button primary" title="Save changes" aria-label="Save changes">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h11l3 3v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 0v6h9V3M7 21v-7h10v7"/></svg>
                    </button>
                    <button id="cancel" class="icon-button" title="Discard changes" aria-label="Discard changes">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>
                    </button>
                </div>
            `
            : `
                <div class="actions" aria-label="Suggestion actions">
                    <button id="copy" class="icon-button" title="Copy commit message" aria-label="Copy commit message">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="1"/><path d="M16 9V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4"/></svg>
                    </button>
                    <button id="edit" class="icon-button" title="Edit suggestion" aria-label="Edit suggestion">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4ZM13.5 6.5l4 4"/></svg>
                    </button>
                    <button id="regenerate" class="icon-button" title="Regenerate suggestion" aria-label="Regenerate suggestion">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0 2 5.5M20 4v7h-7"/></svg>
                    </button>
                    <span class="action-separator" aria-hidden="true"></span>
                    <button id="accept" class="icon-button primary" title="Accept suggestion" aria-label="Accept suggestion">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.2 4.2L19 6.5"/></svg>
                    </button>
                </div>
            `;

        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">

                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1.0"
                >

                <meta
                    http-equiv="Content-Security-Policy"
                    content="default-src 'none'; style-src ${this.panel.webview.cspSource}; script-src 'unsafe-inline';"
                >

                <title>CommitMate Suggestion</title>

                <style>
                    :root {
                        color-scheme: light dark;
                    }

                    * {
                        box-sizing: border-box;
                    }

                    body {
                        font-family: var(
                            --vscode-font-family
                        );

                        color: var(
                            --vscode-foreground
                        );

                        background: var(
                            --vscode-editor-background
                        );

                        margin: 0;
                        padding: 28px 24px 40px;
                    }

                    .container {
                        width: min(100%, 620px);
                        margin: 0 auto;
                    }

                    .header {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        margin-bottom: 28px;
                    }

                    /* removed brand mark for a cleaner production header */

                    .header { gap: 8px; }

                    h1 {
                        font-size: 17px;
                        font-weight: 600;
                        letter-spacing: -0.01em;
                        margin: 0;
                    }

                    .subtitle {
                        margin: 2px 0 0;
                        color: var(--vscode-descriptionForeground);
                        font-size: 12px;
                    }

                    .section {
                        margin-bottom: 18px;
                    }

                    .label {
                        font-size: 12px;
                        font-weight: 600;
                        text-transform: uppercase;
                        letter-spacing: 0.075em;
                        color: var(--vscode-descriptionForeground);
                        margin: 0 0 8px 2px;
                    }

                    .commit-title, .description {
                        border: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border));
                        background: var(--vscode-textCodeBlock-background);
                        box-shadow: 0 1px 2px color-mix(in srgb, #000 6%, transparent);
                    }

                    .commit-title {
                        padding: 15px 16px;
                        border-radius: 10px;
                        font-family: var(
                            --vscode-editor-font-family
                        );
                        font-size: 16px;
                        font-weight: 500;
                        line-height: 1.5;
                        overflow-wrap: anywhere;
                    }

                    .description {
                        padding: 14px 16px;
                        border-radius: 10px;
                        line-height: 1.55;
                    }

                    .edit-input {
                        width: 100%;
                        padding: 12px;

                        background: var(
                            --vscode-input-background
                        );

                        color: var(
                            --vscode-input-foreground
                        );

                        border: 1px solid var(
                            --vscode-input-border
                        );

                        border-radius: 8px;

                        font-family: var(
                            --vscode-editor-font-family
                        );

                        font-size: 16px;
                        box-sizing: border-box;
                    }

                    .edit-textarea {
                        width: 100%;
                        min-height: 120px;
                        padding: 12px;

                        background: var(
                            --vscode-input-background
                        );

                        color: var(
                            --vscode-input-foreground
                        );

                        border: 1px solid var(
                            --vscode-input-border
                        );

                        border-radius: 8px;

                        font-family: var(
                            --vscode-editor-font-family
                        );

                        font-size: 14px;
                        line-height: 1.6;
                        box-sizing: border-box;
                        resize: vertical;
                    }

                    ul {
                        margin: 0;
                        padding-left: 20px;
                    }

                    li {
                        margin-bottom: 7px;
                    }

                    li:last-child {
                        margin-bottom: 0;
                    }

                    .actions {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-top: 22px;
                        padding-top: 18px;
                        border-top: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border));
                    }

                    .icon-button {
                        display: inline-grid;
                        width: 40px;
                        height: 40px;
                        place-items: center;
                        padding: 0;
                        border: 1px solid rgba(0,0,0,0.04);
                        border-radius: 10px;
                        cursor: pointer;
                        color: var(--vscode-button-foreground);
                        background: color-mix(in srgb, var(--vscode-button-secondaryBackground) 88%, var(--vscode-editor-background));
                        box-shadow: 0 1px 0 color-mix(in srgb, var(--vscode-editor-background) 8%, transparent);
                        transition: background 120ms ease, transform 120ms ease, box-shadow 120ms ease;
                    }

                    .icon-button svg {
                        width: 16px;
                        height: 16px;
                        stroke: none;
                        fill: currentColor;
                        opacity: 0.95;
                    }

                    .icon-button:hover {
                        background: color-mix(in srgb, var(--vscode-button-secondaryHoverBackground) 80%, var(--vscode-editor-background));
                        transform: translateY(-1px) scale(1.02);
                        box-shadow: 0 4px 12px color-mix(in srgb, var(--vscode-editor-background) 6%, transparent);
                    }

                    .icon-button:focus-visible, .edit-input:focus-visible, .edit-textarea:focus-visible {
                        outline: 1px solid var(--vscode-focusBorder);
                        outline-offset: 2px;
                    }

                    .icon-button.primary {
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                    }

                    .icon-button.primary:hover {
                        background: var(--vscode-button-hoverBackground);
                    }

                    .action-separator {
                        width: 1px;
                        height: 20px;
                        margin: 0 2px;
                        background: var(--vscode-widget-border, var(--vscode-editorWidget-border));
                    }

                    .analysis-box {
                        border: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border));
                        background: var(--vscode-textCodeBlock-background);
                        border-radius: 10px;
                        padding: 14px 16px;
                    }

                    .analysis-box.large {
                        border-color: var(--vscode-inputValidation-warningBorder);
                    }

                    .analysis-warning {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 12px;
                        padding: 8px 12px;
                        border-radius: 6px;
                        background: color-mix(in srgb, var(--vscode-inputValidation-warningBackground) 30%, transparent);
                        color: var(--vscode-inputValidation-warningForeground);
                        font-weight: 600;
                        font-size: 13px;
                    }

                    .warning-icon {
                        font-size: 15px;
                    }

                    .analysis-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 12px;
                    }

                    .analysis-item {
                        display: flex;
                        flex-direction: column;
                        gap: 2px;
                    }

                    .analysis-value {
                        font-family: var(--vscode-editor-font-family);
                        font-size: 18px;
                        font-weight: 600;
                    }

                    .analysis-key {
                        font-size: 11px;
                        text-transform: uppercase;
                        letter-spacing: 0.05em;
                        color: var(--vscode-descriptionForeground);
                    }

                    .analysis-tip {
                        margin-top: 12px;
                        padding-top: 12px;
                        border-top: 1px solid var(--vscode-widget-border, var(--vscode-editorWidget-border));
                        font-size: 12px;
                        color: var(--vscode-descriptionForeground);
                        line-height: 1.5;
                    }

                    .empty-state {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 36px 20px;
                        border: 1px dashed var(--vscode-widget-border, var(--vscode-editorWidget-border));
                        border-radius: 10px;
                        color: var(--vscode-descriptionForeground);
                        text-align: center;
                        gap: 8px;
                        background: color-mix(in srgb, var(--vscode-editor-background) 96%, transparent);
                    }

                    .empty-title {
                        font-size: 14px;
                        font-weight: 600;
                        color: var(--vscode-foreground);
                    }

                    .empty-desc {
                        font-size: 13px;
                        color: var(--vscode-descriptionForeground);
                        margin: 0 8px;
                    }

                    .retry-button {
                        margin-top: 6px;
                        padding: 8px 12px;
                        border-radius: 8px;
                        border: none;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                    }
                </style>
            </head>

            <body>
                <div class="container">

                    <header class="header">
                        <div>
                            <h1>CommitMate</h1>
                            <p class="subtitle">Generated commit suggestion</p>
                        </div>
                    </header>

                    <div class="section">

                        ${this.state === 'ready' ? `
                            <div class="label">Commit</div>
                            ${titleDisplay}
                        ` : ''}

                        ${this.state === 'ready' ? `
                            <div class="label">Description</div>
                            ${descriptionDisplay}
                        ` : ''}

                        ${this.state !== 'ready' ? `
                            <div class="empty-state">
                                <div class="empty-title">${this.state === 'empty' ? 'No staged changes' : 'Unable to generate suggestion'}</div>
                                <div class="empty-desc">${this.state === 'empty' ? 'Stage some changes and try again to get a commit suggestion.' : (this.escapeHtml(this.errorMessage || 'Something went wrong while fetching suggestions.'))}</div>
                                <button id="retry" class="retry-button">Retry</button>
                            </div>
                        ` : ''}

                        ${this.state === 'ready' ? analysisSection : ''}

                        ${this.state === 'ready' ? actions : ''}

                        ${this.state !== 'ready' ? `<div style="height:18px"></div>` : ''}

                    </div>

                </div>

                <script>
                    const vscode = acquireVsCodeApi();

                    document
                        .getElementById('copy')
                        ?.addEventListener('click', () => {
                            vscode.postMessage({ command: 'copy' });
                        });

                    document
                        .getElementById('edit')
                        ?.addEventListener('click', () => {
                            vscode.postMessage({ command: 'edit' });
                        });

                    document
                        .getElementById('regenerate')
                        ?.addEventListener('click', () => {
                            vscode.postMessage({ command: 'regenerate' });
                        });

                    document
                        .getElementById('retry')
                        ?.addEventListener('click', () => {
                            vscode.postMessage({ command: 'regenerate' });
                        });

                    document
                        .getElementById('accept')
                        ?.addEventListener('click', () => {
                            vscode.postMessage({ command: 'accept' });
                        });

                    document
                        .getElementById('save')
                        ?.addEventListener('click', () => {
                            const title =
                                document.getElementById('commitTitle').value;

                            const description =
                                document.getElementById('description').value;

                            vscode.postMessage({
                                command: 'save',
                                title,
                                description
                            });
                        });

                    document
                        .getElementById('cancel')
                        ?.addEventListener('click', () => {
                            vscode.postMessage({ command: 'cancel' });
                        });
                </script>
            </body>
            </html>
        `;
    }

    private async copySuggestion(): Promise<void> {
        const commitMessage = [
            this.suggestion.title,
            '',
            ...this.suggestion.description.map(
                item => `- ${item}`
            )
        ].join('\n');

        await vscode.env.clipboard.writeText(
            commitMessage
        );

        vscode.window.showInformationMessage(
            'CommitMate: Commit message copied.'
        );
    }

    private enableEditing(): void {
        this.editing = true;
        this.panel.webview.html = this.getHtmlContent();
    }

    private disableEditing(): void {
        this.editing = false;
        this.panel.webview.html = this.getHtmlContent();
    }

    private saveEditedSuggestion(
        message: any
    ): void {
        this.suggestion = {
            title: message.title,
            description: message.description
                .split('\n')
                .map((line: string) => line.trim())
                .filter((line: string) => line.length > 0)
        };

        this.editing = false;

        this.panel.webview.html = this.getHtmlContent();

        vscode.window.showInformationMessage(
            'CommitMate: Suggestion updated.'
        );
    }

    private async regenerateSuggestion(): Promise<void> {
        try {
            vscode.window.showInformationMessage(
                'CommitMate: Regenerating suggestion...'
            );

            const apiService = new ApiService();

            const result = await apiService.generateCommit(
                this.stagedDiff
            );

            this.suggestion = {
                title: result.title,
                description: result.description
            };

            this.panel.webview.html = this.getHtmlContent();

            vscode.window.showInformationMessage(
                'CommitMate: Suggestion regenerated.'
            );
        } catch (error) {
            vscode.window.showErrorMessage(
                'CommitMate: Failed to regenerate suggestion.'
            );
        }
    }

    private async acceptSuggestion(): Promise<void> {
        const confirmation = await vscode.window.showWarningMessage(
            `Create this commit?\n\n${this.suggestion.title}`,
            {
                modal: true
            },
            'Commit',
            'Cancel'
        );

        if (confirmation !== 'Commit') {
            return;
        }

        await this.createCommit(this.suggestion);
    }

    private async createCommit(
        suggestion: CommitSuggestion
    ): Promise<void> {

        const workspaceFolder =
            vscode.workspace.workspaceFolders?.[0];

        if (!workspaceFolder) {
            vscode.window.showErrorMessage(
                'CommitMate: No workspace is open.'
            );
            return;
        }

        const repositoryPath =
            workspaceFolder.uri.fsPath;

        const gitService =
            new GitService(repositoryPath);

        try {
            const hasStagedChanges =
                await gitService.hasStagedChanges();

            if (!hasStagedChanges) {
                vscode.window.showWarningMessage(
                    'CommitMate: There are no staged changes to commit.'
                );
                return;
            }

            await gitService.commit(
                suggestion.title,
                suggestion.description
            );

            vscode.window.showInformationMessage(
                'CommitMate: Commit created successfully.'
            );
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : String(error);

            vscode.window.showErrorMessage(
                `CommitMate: Failed to create commit. ${message}`
            );
        }
    }

    private escapeHtml(value: string): string {
        const amp = '&' + 'amp;';
        const lt = '&' + 'lt;';
        const gt = '&' + 'gt;';
        const quot = '&' + 'quot;';
        const apos = '&#' + '039;';

        return value
            .replace(/&/g, amp)
            .replace(/</g, lt)
            .replace(/>/g, gt)
            .replace(/"/g, quot)
            .replace(/'/g, apos);
    }
}
