import json
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

def github_request(url: str, token: str) -> dict | list:
    """Make an authenticated request to the GitHub API."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "data-fetcher",
    }
    req = Request(url, headers=headers)
    try:
        with urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as e:
        if e.code == 403:
            print(f"Rate limited or forbidden: {url}", file=sys.stderr)
            reset = e.headers.get("X-RateLimit-Reset")
            if reset:
                wait = int(reset) - int(time.time())
                print(f"Rate limit resets in {wait}s", file=sys.stderr)
        elif e.code == 404:
            print(f"Not found: {url}", file=sys.stderr)
        else:
            print(f"HTTP {e.code} for {url}: {e.reason}", file=sys.stderr)
        raise
    except URLError as e:
        print(f"Network error: {e.reason}", file=sys.stderr)
        raise

def github_paginate(url: str, token: str) -> list:
    """Fetch all pages from a paginated GitHub API endpoint."""
    results = []
    page = 1
    per_page = 100
    while True:
        separator = "&" if "?" in url else "?"
        page_url = f"{url}{separator}per_page={per_page}&page={page}"
        data = github_request(page_url, token)
        if not data:
            break
        results.extend(data)
        if len(data) < per_page:
            break
        page += 1
    return results

def check_github_pages(owner: str, repo: str, token: str) -> str | None:
    """Check if a repository has GitHub Pages enabled and return the URL."""
    url = f"https://api.github.com/repos/{owner}/{repo}/pages"
    try:
        data = github_request(url, token)
        if data.get("status") == "built" or data.get("html_url"):
            return data.get("html_url")
    except HTTPError:
        pass
    return None


def fetch_languages(owner: str, repo: str, token: str) -> dict:
    """Fetch language breakdown for a repository."""
    url = f"https://api.github.com/repos/{owner}/{repo}/languages"
    try:
        return github_request(url, token)
    except HTTPError:
        return {}
