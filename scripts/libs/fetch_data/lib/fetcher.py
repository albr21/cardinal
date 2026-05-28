import sys

from .github_api import github_paginate

def fetch_repos_for_source(source: dict, token: str) -> list:
    """Fetch repositories for a single source (user or org)."""
    source_type = source["type"]
    name = source["name"]
    github_base_url = "https://api.github.com"
    include_forks = source.get("include_forks", False)
    include_archived = source.get("include_archived", False)

    if source_type == "user":
        url = f"{github_base_url}/users/{name}/repos?type=owner"
    elif source_type == "org":
        url = f"{github_base_url}/orgs/{name}/repos"
    else:
        print(f"Unknown source type: {source_type}", file=sys.stderr)
        return []

    print(f"  Fetching repos for {source_type}/{name}...")
    repos = github_paginate(url, token)

    filtered = []
    for repo in repos:
        if repo.get("private", False):
            continue
        if not include_forks and repo.get("fork", False):
            continue
        if not include_archived and repo.get("archived", False):
            continue
        filtered.append(repo)

    print(f"  Found {len(filtered)} repos (filtered from {len(repos)} total)")
    return filtered


def fetch_all_repos(sources: list, token: str, exclude_repos: set) -> list:
    """Fetch repos from all sources, exclude and deduplicate."""
    all_repos = []
    for source in sources:
        repos = fetch_repos_for_source(source, token)
        all_repos.extend(repos)

    all_repos = [
        r for r in all_repos
        if r["full_name"] not in exclude_repos and r["name"] not in exclude_repos
    ]

    seen = set()
    unique_repos = []
    for repo in all_repos:
        if repo["full_name"] not in seen:
            seen.add(repo["full_name"])
            unique_repos.append(repo)

    return unique_repos
