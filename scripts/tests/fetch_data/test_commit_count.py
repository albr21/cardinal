import json
from io import BytesIO
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

from lib.github_api import fetch_commit_count
from lib.transformer import extract_repo_data, process_repos

class TestFetchCommitCount:
    @patch("lib.github_api.urlopen")
    def test_returns_count_from_link_header(self, mock_urlopen):
        """When Link header has rel='last', parse the page number as commit count."""
        mock_response = MagicMock()
        mock_response.headers = {
            "Link": '<https://api.github.com/repos/o/r/commits?per_page=1&page=142>; rel="last"'
        }
        mock_response.read.return_value = b"[{}]"
        mock_response.__enter__ = MagicMock(return_value=mock_response)
        mock_response.__exit__ = MagicMock(return_value=False)

        mock_urlopen.side_effect = [mock_response, mock_response]

        result = fetch_commit_count("owner", "repo", "fake-token")
        assert result == 142

    @patch("lib.github_api.urlopen")
    def test_returns_count_when_no_link_header(self, mock_urlopen):
        """When no Link header (single page), count from response body."""
        # First call for contributors endpoint
        mock_resp_contributors = MagicMock()
        mock_resp_contributors.headers = {}
        mock_resp_contributors.read.return_value = b"[{}]"
        mock_resp_contributors.__enter__ = MagicMock(return_value=mock_resp_contributors)
        mock_resp_contributors.__exit__ = MagicMock(return_value=False)

        # Second call for commits endpoint - no Link header
        mock_resp_commits = MagicMock()
        mock_resp_commits.headers = MagicMock()
        mock_resp_commits.headers.get = MagicMock(return_value="")
        mock_resp_commits.read.return_value = json.dumps([{"sha": "abc"}]).encode()
        mock_resp_commits.__enter__ = MagicMock(return_value=mock_resp_commits)
        mock_resp_commits.__exit__ = MagicMock(return_value=False)

        mock_urlopen.side_effect = [mock_resp_contributors, mock_resp_commits]

        result = fetch_commit_count("owner", "repo", "fake-token")
        assert result == 1

    @patch("lib.github_api.urlopen")
    def test_returns_none_on_http_error(self, mock_urlopen):
        """On HTTPError, return None."""
        mock_urlopen.side_effect = HTTPError(
            url="https://api.github.com/repos/o/r/commits",
            code=404,
            msg="Not Found",
            hdrs={},
            fp=BytesIO(b""),
        )

        result = fetch_commit_count("owner", "repo", "fake-token")
        assert result is None

    @patch("lib.github_api.urlopen")
    def test_returns_zero_for_empty_response(self, mock_urlopen):
        """When commits endpoint returns empty array, return 0."""
        mock_resp_contributors = MagicMock()
        mock_resp_contributors.headers = {}
        mock_resp_contributors.read.return_value = b"[{}]"
        mock_resp_contributors.__enter__ = MagicMock(return_value=mock_resp_contributors)
        mock_resp_contributors.__exit__ = MagicMock(return_value=False)

        mock_resp_commits = MagicMock()
        mock_resp_commits.headers = MagicMock()
        mock_resp_commits.headers.get = MagicMock(return_value="")
        mock_resp_commits.read.return_value = b"[]"
        mock_resp_commits.__enter__ = MagicMock(return_value=mock_resp_commits)
        mock_resp_commits.__exit__ = MagicMock(return_value=False)

        mock_urlopen.side_effect = [mock_resp_contributors, mock_resp_commits]

        result = fetch_commit_count("owner", "repo", "fake-token")
        assert result == 0

class TestExtractRepoDataCommits:
    SAMPLE_REPO = {
        "name": "test-repo",
        "full_name": "owner/test-repo",
        "owner": {"login": "owner", "avatar_url": "", "type": "User"},
        "description": "A test repo",
        "html_url": "https://github.com/owner/test-repo",
        "homepage": "",
        "language": "Python",
        "topics": ["test"],
        "stargazers_count": 5,
        "forks_count": 2,
        "open_issues_count": 1,
        "size": 100,
        "default_branch": "main",
        "license": None,
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-06-01T00:00:00Z",
        "pushed_at": "2024-06-01T00:00:00Z",
        "fork": False,
        "archived": False,
    }

    @patch("lib.transformer.fetch_commit_count", return_value=42)
    @patch("lib.transformer.check_github_pages", return_value=None)
    def test_with_commits_true_fetches_count(self, mock_pages, mock_commits):
        """When with_commits=True, commit_count should be populated."""
        result = extract_repo_data(self.SAMPLE_REPO, "token", [], with_commits=True)
        assert result["commit_count"] == 42
        mock_commits.assert_called_once_with("owner", "test-repo", "token")

    @patch("lib.transformer.fetch_commit_count")
    @patch("lib.transformer.check_github_pages", return_value=None)
    def test_with_commits_false_skips_fetch(self, mock_pages, mock_commits):
        """When with_commits=False (default), commit_count is None and no API call."""
        result = extract_repo_data(self.SAMPLE_REPO, "token", [], with_commits=False)
        assert result["commit_count"] is None
        mock_commits.assert_not_called()

    @patch("lib.transformer.fetch_commit_count", return_value=None)
    @patch("lib.transformer.check_github_pages", return_value=None)
    def test_with_commits_api_failure(self, mock_pages, mock_commits):
        """When fetch_commit_count returns None, commit_count is None."""
        result = extract_repo_data(self.SAMPLE_REPO, "token", [], with_commits=True)
        assert result["commit_count"] is None

class TestProcessReposCommits:
    """Tests for with_commits parameter in process_repos."""

    SAMPLE_REPOS = [
        {
            "name": "repo-a",
            "full_name": "owner/repo-a",
            "owner": {"login": "owner", "avatar_url": "", "type": "User"},
            "description": "",
            "html_url": "",
            "homepage": "",
            "language": "Python",
            "topics": [],
            "stargazers_count": 10,
            "forks_count": 0,
            "open_issues_count": 0,
            "size": 50,
            "default_branch": "main",
            "license": None,
            "created_at": "",
            "updated_at": "",
            "pushed_at": "",
            "fork": False,
            "archived": False,
        }
    ]

    @patch("lib.transformer.fetch_commit_count", return_value=99)
    @patch("lib.transformer.check_github_pages", return_value=None)
    def test_process_repos_with_commits(self, mock_pages, mock_commits):
        """process_repos passes with_commits to extract_repo_data."""
        repos_data, _ = process_repos(self.SAMPLE_REPOS, "token", [], with_commits=True)
        assert repos_data[0]["commit_count"] == 99

    @patch("lib.transformer.fetch_commit_count")
    @patch("lib.transformer.check_github_pages", return_value=None)
    def test_process_repos_without_commits(self, mock_pages, mock_commits):
        """process_repos with with_commits=False does not call fetch_commit_count."""
        repos_data, _ = process_repos(self.SAMPLE_REPOS, "token", [], with_commits=False)
        assert repos_data[0]["commit_count"] is None
        mock_commits.assert_not_called()
