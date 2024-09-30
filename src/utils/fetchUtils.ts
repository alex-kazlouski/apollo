import axios, { AxiosResponse } from 'axios';
import PQueue from 'p-queue';

const queue = new PQueue({ concurrency: 2 });
const GITHUB_API_URL = 'https://api.github.com';

interface RepositoryDetails {
  name: string;
  size: number;
  owner: string;
  isPrivate: boolean;
  ymlContent: string;
  webhooks: string[];
  fileCount: number;
}

function getAuthHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function fetchRepositories(token: string): Promise<any[]> {
  const headers = getAuthHeaders(token);
  const response: AxiosResponse<any[]> = await axios.get(
    `${GITHUB_API_URL}/user/repos`,
    {
      headers,
    }
  );
  return response.data;
}

export async function fetchAuthenticatedUser(
  token: string
): Promise<string | null> {
  const headers = getAuthHeaders(token);

  try {
    const response: AxiosResponse<{ login: string }> = await axios.get(
      `${GITHUB_API_URL}/user`,
      { headers }
    );
    return response.data.login;
  } catch (error) {
    console.error('Error fetching authenticated user details:', error);
    return null;
  }
}

export async function fetchRepositoryDetails(
  token: string,
  username: string,
  repoName: string
): Promise<RepositoryDetails | undefined> {
  return queue.add(async () => {
    try {
      const [repoDetails, ymlContent, webhooks, fileCount] = await Promise.all([
        fetchRepoDetails(token, username, repoName),
        fetchYmlFile(token, username, repoName),
        fetchWebhooks(token, username, repoName),
        fetchFileCount(token, username, repoName),
      ]);

      return {
        name: repoDetails.name,
        size: repoDetails.size,
        owner: repoDetails.owner,
        isPrivate: repoDetails.isPrivate,
        ymlContent: ymlContent || 'No YML file found',
        webhooks: webhooks || [],
        fileCount: fileCount || 0,
      };
    } catch (error) {
      console.error(
        `Error fetching repository details for ${repoName}:`,
        error
      );
      return undefined;
    }
  });
}

async function fetchRepoDetails(
  token: string,
  username: string,
  repoName: string
): Promise<{ name: string; size: number; owner: string; isPrivate: boolean }> {
  const headers = getAuthHeaders(token);
  const response: AxiosResponse<{
    name: string;
    size: number;
    owner: { login: string };
    private: boolean;
  }> = await axios.get(`${GITHUB_API_URL}/repos/${username}/${repoName}`, {
    headers,
  });
  return {
    name: response.data.name,
    size: response.data.size,
    owner: response.data.owner.login,
    isPrivate: response.data.private,
  };
}

async function fetchYmlFile(
  token: string,
  username: string,
  repoName: string
): Promise<string> {
  const headers = getAuthHeaders(token);
  const response: AxiosResponse<{ download_url: string }[]> = await axios.get(
    `${GITHUB_API_URL}/repos/${username}/${repoName}/contents/.github/workflows`,
    { headers }
  );

  if (response.data.length > 0) {
    const ymlFileResponse = await axios.get<string>(
      response.data[0].download_url
    );
    return ymlFileResponse.data;
  }
  return 'No YML file found';
}

async function fetchWebhooks(
  token: string,
  username: string,
  repoName: string
): Promise<string[]> {
  const headers = getAuthHeaders(token);
  const response: AxiosResponse<{ config: { url: string } }[]> =
    await axios.get(`${GITHUB_API_URL}/repos/${username}/${repoName}/hooks`, {
      headers,
    });

  return response.data.map((hook) => hook.config.url);
}

async function fetchFileCount(
  token: string,
  username: string,
  repoName: string,
  path: string = ''
): Promise<number> {
  const headers = getAuthHeaders(token);
  let fileCount = 0;
  let page = 1;
  const perPage = 100;
  let hasMorePages = true;

  while (hasMorePages) {
    const response: AxiosResponse<any[]> = await axios.get(
      `${GITHUB_API_URL}/repos/${username}/${repoName}/contents/${path}?per_page=${perPage}&page=${page}`,
      { headers }
    );

    for (const item of response.data) {
      if (item.type === 'file') {
        fileCount++;
      } else if (item.type === 'dir') {
        const subDirFileCount = await fetchFileCount(
          token,
          username,
          repoName,
          item.path
        );
        fileCount += subDirFileCount;
      }
    }

    hasMorePages = response.data.length === perPage;
    page++;
  }

  return fileCount;
}
