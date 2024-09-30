import {
  fetchRepositories,
  fetchRepositoryDetails,
  fetchAuthenticatedUser,
} from './utils/fetchUtils';

export const resolvers = {
  Query: {
    listRepositories: async (_: any, { token }: { token: string }) => {
      if (!token) {
        throw new Error('GitHub token is required');
      }

      const repositories = await fetchRepositories(token);

      return repositories.map((repo) => ({
        name: repo.name,
        size: repo.size,
        owner: repo.owner.login,
      }));
    },

    repositoryDetails: async (
      _: any,
      { token, name }: { token: string; name: string }
    ) => {
      if (!token) {
        throw new Error('GitHub token is required');
      }

      const username = await fetchAuthenticatedUser(token);

      if (!username) {
        throw new Error('Failed to fetch authenticated user details');
      }

      const repoDetails = await fetchRepositoryDetails(token, username, name);

      if (!repoDetails) {
        throw new Error(`Repository ${name} not found`);
      }

      return {
        name: repoDetails.name,
        size: repoDetails.size,
        owner: repoDetails.owner,
        isPrivate: repoDetails.isPrivate,
        fileCount: repoDetails.fileCount,
        yamlContent: repoDetails.ymlContent,
        webhooks: repoDetails.webhooks.map((url: string, index: number) => ({
          id: index,
          url,
          active: true,
        })),
      };
    },
  },
};
