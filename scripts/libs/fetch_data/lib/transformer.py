import json
import time
from pathlib import Path

from .github_api import check_github_pages, fetch_languages

def extract_repo_data(repo: dict, token: str, pinned_repos: list) -> dict:
    """Extract relevant data from a GitHub API repo object."""
    owner = repo["owner"]["login"]
    name = repo["name"]
    full_name = repo["full_name"]

    # Check for GitHub Pages
    pages_url = check_github_pages(owner, name, token)

    return {
        "name": name,
        "full_name": full_name,
        "owner": owner,
        "description": repo.get("description", ""),
        "url": repo.get("html_url", ""),
        "homepage": repo.get("homepage", ""),
        "pages_url": pages_url,
        "language": repo.get("language", ""),
        "topics": repo.get("topics", []),
        "stars": repo.get("stargazers_count", 0),
        "forks": repo.get("forks_count", 0),
        "open_issues": repo.get("open_issues_count", 0),
        "size_kb": repo.get("size", 0),
        "default_branch": repo.get("default_branch", "main"),
        "license": repo.get("license", {}).get("spdx_id") if repo.get("license") else None,
        "created_at": repo.get("created_at", ""),
        "updated_at": repo.get("updated_at", ""),
        "pushed_at": repo.get("pushed_at", ""),
        "is_fork": repo.get("fork", False),
        "is_archived": repo.get("archived", False),
        "is_pinned": full_name in pinned_repos,
    }

def process_repos(repos: list, token: str, pinned_repos: list, with_languages: bool = False) -> tuple[list, dict]:
    """Process raw repos into structured data + owner avatars."""
    repos_data = []
    owner_avatars = {}

    for repo in repos:
        data = extract_repo_data(repo, token, pinned_repos)

        owner_login = repo["owner"]["login"]
        if owner_login not in owner_avatars:
            owner_avatars[owner_login] = {
                "avatar_url": repo["owner"].get("avatar_url", ""),
                "type": repo["owner"].get("type", "User"),
            }

        if with_languages:
            data["languages"] = fetch_languages(data["owner"], data["name"], token)

        repos_data.append(data)

    repos_data.sort(key=lambda r: (not r["is_pinned"], -(r.get("stars", 0))))
    return repos_data, owner_avatars

def build_output(repos_data: list, owner_avatars: dict, site_config: dict) -> dict:
    """Assemble the final output JSON structure."""
    return {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "site": site_config,
        "owners": owner_avatars,
        "repos_count": len(repos_data),
        "repos": repos_data,
    }

def write_output(output: dict, output_path: str) -> Path:
    """Write the output JSON to disk."""
    path = Path(output_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    return path
