from unittest.mock import patch
from lib.fetcher import fetch_all_repos, fetch_repos_for_source

def _make_repo(name, owner="testuser", private=False, fork=False, archived=False):
    """Helper to create a minimal GitHub API repo response."""
    return {
        "name": name,
        "full_name": f"{owner}/{name}",
        "owner": {"login": owner, "avatar_url": "", "type": "User"},
        "private": private,
        "fork": fork,
        "archived": archived,
        "html_url": f"https://github.com/{owner}/{name}",
    }


class TestFetchReposForSource:
    """Tests for fetch_repos_for_source()."""

    @patch("lib.fetcher.github_paginate")
    def test_user_source_url(self, mock_paginate):
        """Should call correct URL for user type."""
        mock_paginate.return_value = []
        source = {"type": "user", "name": "johndoe"}

        fetch_repos_for_source(source, "token")

        url = mock_paginate.call_args[0][0]
        assert "users/johndoe/repos?type=owner" in url

    @patch("lib.fetcher.github_paginate")
    def test_org_source_url(self, mock_paginate):
        """Should call correct URL for org type."""
        mock_paginate.return_value = []
        source = {"type": "org", "name": "acme-corp"}

        fetch_repos_for_source(source, "token")

        url = mock_paginate.call_args[0][0]
        assert "orgs/acme-corp/repos" in url

    @patch("lib.fetcher.github_paginate")
    def test_unknown_source_type(self, mock_paginate):
        """Should return empty list for unknown source type."""
        source = {"type": "unknown", "name": "foo"}

        result = fetch_repos_for_source(source, "token")

        assert result == []
        mock_paginate.assert_not_called()

    @patch("lib.fetcher.github_paginate")
    def test_filters_private_repos(self, mock_paginate):
        """Should exclude private repos."""
        mock_paginate.return_value = [
            _make_repo("public-repo"),
            _make_repo("private-repo", private=True),
        ]
        source = {"type": "user", "name": "testuser"}

        result = fetch_repos_for_source(source, "token")

        assert len(result) == 1
        assert result[0]["name"] == "public-repo"

    @patch("lib.fetcher.github_paginate")
    def test_filters_forks_by_default(self, mock_paginate):
        """Should exclude forks when include_forks is False (default)."""
        mock_paginate.return_value = [
            _make_repo("original"),
            _make_repo("forked", fork=True),
        ]
        source = {"type": "user", "name": "testuser"}

        result = fetch_repos_for_source(source, "token")

        assert len(result) == 1
        assert result[0]["name"] == "original"

    @patch("lib.fetcher.github_paginate")
    def test_includes_forks_when_requested(self, mock_paginate):
        """Should include forks when include_forks is True."""
        mock_paginate.return_value = [
            _make_repo("original"),
            _make_repo("forked", fork=True),
        ]
        source = {"type": "user", "name": "testuser", "include_forks": True}

        result = fetch_repos_for_source(source, "token")

        assert len(result) == 2

    @patch("lib.fetcher.github_paginate")
    def test_filters_archived_by_default(self, mock_paginate):
        """Should exclude archived repos when include_archived is False."""
        mock_paginate.return_value = [
            _make_repo("active"),
            _make_repo("old-project", archived=True),
        ]
        source = {"type": "user", "name": "testuser"}

        result = fetch_repos_for_source(source, "token")

        assert len(result) == 1
        assert result[0]["name"] == "active"

    @patch("lib.fetcher.github_paginate")
    def test_includes_archived_when_requested(self, mock_paginate):
        """Should include archived repos when include_archived is True."""
        mock_paginate.return_value = [
            _make_repo("active"),
            _make_repo("old-project", archived=True),
        ]
        source = {"type": "user", "name": "testuser", "include_archived": True}

        result = fetch_repos_for_source(source, "token")

        assert len(result) == 2


class TestFetchAllRepos:
    """Tests for fetch_all_repos()."""

    @patch("lib.fetcher.fetch_repos_for_source")
    def test_merges_multiple_sources(self, mock_fetch):
        """Should aggregate repos from multiple sources."""
        mock_fetch.side_effect = [
            [_make_repo("repo-a", owner="user1")],
            [_make_repo("repo-b", owner="org1")],
        ]
        sources = [
            {"type": "user", "name": "user1"},
            {"type": "org", "name": "org1"},
        ]

        result = fetch_all_repos(sources, "token", set())

        assert len(result) == 2

    @patch("lib.fetcher.fetch_repos_for_source")
    def test_excludes_by_full_name(self, mock_fetch):
        """Should exclude repos matching full_name in exclude set."""
        mock_fetch.return_value = [
            _make_repo("keep-me", owner="user"),
            _make_repo("remove-me", owner="user"),
        ]
        sources = [{"type": "user", "name": "user"}]

        result = fetch_all_repos(sources, "token", {"user/remove-me"})

        assert len(result) == 1
        assert result[0]["name"] == "keep-me"

    @patch("lib.fetcher.fetch_repos_for_source")
    def test_excludes_by_short_name(self, mock_fetch):
        """Should exclude repos matching name (without owner) in exclude set."""
        mock_fetch.return_value = [
            _make_repo("keep-me", owner="user"),
            _make_repo("remove-me", owner="user"),
        ]
        sources = [{"type": "user", "name": "user"}]

        result = fetch_all_repos(sources, "token", {"remove-me"})

        assert len(result) == 1
        assert result[0]["name"] == "keep-me"

    @patch("lib.fetcher.fetch_repos_for_source")
    def test_deduplicates_repos(self, mock_fetch):
        """Should deduplicate repos by full_name."""
        repo = _make_repo("shared-repo", owner="user")
        mock_fetch.side_effect = [[repo], [repo]]
        sources = [
            {"type": "user", "name": "user"},
            {"type": "user", "name": "user"},
        ]

        result = fetch_all_repos(sources, "token", set())

        assert len(result) == 1
