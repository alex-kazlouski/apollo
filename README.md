# Apollo

This project is a GraphQL API built with Apollo Server that fetches and serves repository details from GitHub. The API limits fetching of repository details to 2 repositories concurrently using a queue mechanism.

## Features

- Fetch a list of user repositories
- Get detailed repository information
- Concurrent fetching for scalability

## Queries

Get all repositories:

```sh
query {
  listRepositories(token: "YOUR_GITHUB_TOKEN") {
    name
    size
    owner
  }
}
```

Get detailed repository information:

```sh
query {
  repositoryDetails(token: "YOUR_GITHUB_TOKEN", name: "repository_name") {
    name
    size
    owner
    isPrivate
    fileCount
    yamlContent
    webhooks {
      id
      url
      active
    }
  }
}
```
