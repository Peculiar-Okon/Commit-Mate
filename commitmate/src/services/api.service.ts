import axios from 'axios';

export interface GenerateCommitRequest {
    diff: string;
}

export interface GenerateCommitResponse {
    title: string;
    description: string[];
}

export class ApiService {
    private readonly baseUrl = 'http://localhost:3000';

    async generateCommit(
        diff: string
    ): Promise<GenerateCommitResponse> {

        const response = await axios.post<GenerateCommitResponse>(
            `${this.baseUrl}/commits/generate`,
            {
                diff,
            }
        );

        return response.data;
    }
}