import { gql } from 'apollo-server';
import {
  fetchRepositoryDetails,
  fetchAuthenticatedUser,
  fetchRepositories,
} from './utils/fetchUtils';

interface Repository {
  name: string;
  size: number;
  owner: string;
  isPrivate: boolean;
  fileCount: number;
  yamlContent: string;
  webhooks: Array<{ id: number; url: string; active: boolean }>;
}

export const typeDefs = gql`
  type Repository {
    name: String!
    size: Int!
    owner: String!
    isPrivate: Boolean!
    fileCount: Int!
    yamlContent: String
    webhooks: [Webhook!]!
  }

  type RepositorySummary {
    name: String!
    size: Int!
    owner: String!
  }

  type Webhook {
    id: ID!
    url: String!
    active: Boolean!
  }

  type Query {
    listRepositories(token: String!): [RepositorySummary!]!
    repositoryDetails(token: String!, name: String!): Repository
  }
`;

export const resolvers = {
  Query: {
    listRepositories: async (
      _: unknown,
      { token }: { token: string }
    ): Promise<Repository[]> => {
      return await fetchRepositories(token);
    },

    repositoryDetails: async (
      _: unknown,
      { token, name }: { token: string; name: string }
    ): Promise<Repository> => {
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
        webhooks: repoDetails.webhooks.map((url, index) => ({
          id: index,
          url,
          active: true,
        })),
      };
    },
  },
};
