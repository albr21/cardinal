# cardinal

The central node for everything I build and explore.
A static website showcasing GitHub repositories accross users and organizations, computing statistics and aggregating data from GitHub API.
Built with vanilla HTML/CSS/JS.

## Main Features

- Home summary page
- GitHub repositories dashboard
- Pinned repositories highlighted at the top
- Detailed modal for each repository
- Search system for repositories
- GitHub statistics dashboard
- Dark / Light mode
- Responsive design

## Usage

### Configuration

The configuration file is stored in the `config.json` file.

```json
{
  "github": {
    "token_env": "GITHUB_TOKEN",
    "sources": [
      { "type": "user", "name": "your-username", "include_forks": false, "include_archived": false },
      { "type": "org", "name": "your-org", "include_forks": false, "include_archived": false }
    ],
    "exclude_repos": [],
    "pinned_repos": ["your-username/favorite-repo"]
  },
  "site": {
    "title": "Site Title",
    "description": "Site description",
    "author": "Your Name"
  }   
}
```

### Fetching data

```bash
python scripts/libs/fetch_data/main.py [--config <path>] [--output <path>] [--with-languages]
```

### Serving Local Site

```bash
python -m http.server 8080 --directory src/
```

## GitHub Token Scope

The GitHub API requires a token with the `repo` scope to fetch data from the GitHub API.

## Contributing

Check out the [CONTRIBUTING](CONTRIBUTING.md) file for guidelines on how to contribute to this project.

## License

This project is licensed under the AGPL License - see the [LICENSE](LICENSE) file for details.
