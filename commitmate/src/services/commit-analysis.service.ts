export interface CommitSizeAnalysis {
    filesChanged: number;
    linesAdded: number;
    linesRemoved: number;
    totalChangedLines: number;
    isLarge: boolean;
}

export class CommitAnalysisService {

    analyzeDiff(diff: string): CommitSizeAnalysis {

        const filesChanged = this.countFilesChanged(diff);
        const linesAdded = this.countLinesAdded(diff);
        const linesRemoved = this.countLinesRemoved(diff);

        const totalChangedLines = linesAdded + linesRemoved;

        const isLarge =
            filesChanged > 15 ||
            totalChangedLines > 500;

        return {
            filesChanged,
            linesAdded,
            linesRemoved,
            totalChangedLines,
            isLarge,
        };
    }

    private countFilesChanged(diff: string): number {

        const matches = diff.match(/^diff --git /gm);

        return matches ? matches.length : 0;
    }

    private countLinesAdded(diff: string): number {

        const lines = diff.split('\n');

        return lines.filter(line =>
            line.startsWith('+') &&
            !line.startsWith('+++')
        ).length;
    }

    private countLinesRemoved(diff: string): number {

        const lines = diff.split('\n');

        return lines.filter(line =>
            line.startsWith('-') &&
            !line.startsWith('---')
        ).length;
    }
}