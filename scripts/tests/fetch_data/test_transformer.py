import json
from unittest.mock import patch
from lib.transformer import build_output, extract_repo_data, process_repos, write_output

def _make_raw_repo(
    name="my-repo",
    owner="testuser",
    stars=10,
    forks=2,
    language="Python",
    fork=False,
    archived=False,
    pages_url=None,
):
    """Helper to build a raw GitHub API repo response."""
    return {
        "name": name,
        "full_name": f"{owner}/{name}",
        "owner": {
            "login": owner,
            "avatar_url": f"https://avatars.githubusercontent.com/{owner}",
            "type": "User",
        },
        "description": f"Description for {name}",
        "html_url": f"https://github.com/{owner}/{name}",
        "homepage": "",
        "language": language,
        "topics": ["python", "testing"],
        "stargazers_count": stars,
        "forks_count": forks,
        "open_issues_count": 3,
        "size": 1024,
        "default_branch": "main",
        "license": {"spdx_id": "MIT"},
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2026-05-01T00:00:00Z",
        "pushed_at": "2026-05-01T00:00:00Z",
        "fork": fork,
        "archived": archived,
        "private": False,
    }

class TestExtractRepoData:
    @patch("lib.transformer.check_github_pages")
    def test_extracts_all_fields(self, mock_pages):
        """Should extract all expected fields from raw repo."""
        mock_pages.return_value = "https://testuser.github.io/my-repo"
        raw = _make_raw_repo()

        result = extract_repo_data(raw, "token", [])

        assert result["name"] == "my-repo"
        assert result["full_name"] == "testuser/my-repo"
        assert result["owner"] == "testuser"
        assert result["description"] == "Description for my-repo"
        assert result["url"] == "https://github.com/testuser/my-repo"
        assert result["language"] == "Python"
        assert result["topics"] == ["python", "testing"]
        assert result["stars"] == 10
        assert result["forks"] == 2
        assert result["open_issues"] == 3
        assert result["size_kb"] == 1024
        assert result["default_branch"] == "main"
        assert result["license"] == "MIT"
        assert result["pages_url"] == "https://testuser.github.io/my-repo"
        assert result["is_fork"] is False
        assert result["is_archived"] is False
        assert result["is_pinned"] is False

    @patch("lib.transformer.check_github_pages")
    def test_pinned_repo(self, mock_pages):
        """Should mark repo as pinned when full_name is in pinned list."""
        mock_pages.return_value = None
        raw = _make_raw_repo()

        result = extract_repo_data(raw, "token", ["testuser/my-repo"])

        assert result["is_pinned"] is True

    @patch("lib.transformer.check_github_pages")
    def test_no_license(self, mock_pages):
        """Should handle repo without license."""
        mock_pages.return_value = None
        raw = _make_raw_repo()
        raw["license"] = None

        result = extract_repo_data(raw, "token", [])

        assert result["license"] is None

    @patch("lib.transformer.check_github_pages")
    def test_missing_optional_fields(self, mock_pages):
        """Should use defaults for missing optional fields."""
        mock_pages.return_value = None
        raw = _make_raw_repo()
        del raw["description"]
        del raw["topics"]
        del raw["homepage"]

        result = extract_repo_data(raw, "token", [])

        assert result["description"] == ""
        assert result["topics"] == []
        assert result["homepage"] == ""

class TestProcessRepos:
    @patch("lib.transformer.check_github_pages")
    def test_processes_multiple_repos(self, mock_pages):
        """Should process list of raw repos into structured data."""
        mock_pages.return_value = None
        repos = [
            _make_raw_repo("repo-a", stars=5),
            _make_raw_repo("repo-b", stars=20),
        ]

        data, avatars = process_repos(repos, "token", [])

        assert len(data) == 2

    @patch("lib.transformer.check_github_pages")
    def test_sorts_pinned_first(self, mock_pages):
        """Should sort pinned repos before non-pinned."""
        mock_pages.return_value = None
        repos = [
            _make_raw_repo("unpinned", stars=100),
            _make_raw_repo("pinned", stars=1),
        ]

        data, _ = process_repos(repos, "token", ["testuser/pinned"])

        assert data[0]["name"] == "pinned"
        assert data[1]["name"] == "unpinned"

    @patch("lib.transformer.check_github_pages")
    def test_sorts_by_stars_within_group(self, mock_pages):
        """Should sort by stars descending within pinned/unpinned groups."""
        mock_pages.return_value = None
        repos = [
            _make_raw_repo("low-stars", stars=5),
            _make_raw_repo("high-stars", stars=50),
            _make_raw_repo("mid-stars", stars=20),
        ]

        data, _ = process_repos(repos, "token", [])

        assert data[0]["name"] == "high-stars"
        assert data[1]["name"] == "mid-stars"
        assert data[2]["name"] == "low-stars"

    @patch("lib.transformer.check_github_pages")
    def test_collects_owner_avatars(self, mock_pages):
        """Should collect unique owner avatar data."""
        mock_pages.return_value = None
        repos = [
            _make_raw_repo("repo-a", owner="alice"),
            _make_raw_repo("repo-b", owner="alice"),
            _make_raw_repo("repo-c", owner="bob"),
        ]

        _, avatars = process_repos(repos, "token", [])

        assert len(avatars) == 2
        assert "alice" in avatars
        assert "bob" in avatars
        assert avatars["alice"]["avatar_url"] == "https://avatars.githubusercontent.com/alice"
        assert avatars["alice"]["type"] == "User"

    @patch("lib.transformer.check_github_pages")
    @patch("lib.transformer.fetch_languages")
    def test_with_languages_option(self, mock_langs, mock_pages):
        """Should fetch languages when with_languages=True."""
        mock_pages.return_value = None
        mock_langs.return_value = {"Python": 10000, "Shell": 500}
        repos = [_make_raw_repo()]

        data, _ = process_repos(repos, "token", [], with_languages=True)

        assert data[0]["languages"] == {"Python": 10000, "Shell": 500}
        mock_langs.assert_called_once()

    @patch("lib.transformer.check_github_pages")
    def test_without_languages_option(self, mock_pages):
        """Should not have languages key when with_languages=False."""
        mock_pages.return_value = None
        repos = [_make_raw_repo()]

        data, _ = process_repos(repos, "token", [], with_languages=False)

        assert "languages" not in data[0]

class TestBuildOutput:
    def test_structure(self):
        """Should produce the expected output structure."""
        repos_data = [{"name": "repo-a", "stars": 10}]
        owners = {"user": {"avatar_url": "https://example.com/avatar", "type": "User"}}
        site_config = {"title": "Test Site"}

        result = build_output(repos_data, owners, site_config)

        assert "generated_at" in result
        assert result["site"] == site_config
        assert result["owners"] == owners
        assert result["repos_count"] == 1
        assert result["repos"] == repos_data

    def test_generated_at_format(self):
        """Should produce ISO 8601 UTC timestamp."""
        result = build_output([], {}, {})

        # Should be parseable and end with Z
        assert result["generated_at"].endswith("Z")
        assert "T" in result["generated_at"]

class TestWriteOutput:
    def test_writes_json_file(self, tmp_path):
        """Should write valid JSON to the given path."""
        output = {"repos": [{"name": "test"}], "repos_count": 1}
        output_path = tmp_path / "data" / "repos.json"

        result = write_output(output, str(output_path))

        assert result == output_path
        assert output_path.exists()
        with open(output_path, "r", encoding="utf-8") as f:
            loaded = json.load(f)
        assert loaded == output

    def test_creates_parent_dirs(self, tmp_path):
        """Should create intermediate directories if needed."""
        output_path = tmp_path / "a" / "b" / "c" / "output.json"

        write_output({"test": True}, str(output_path))

        assert output_path.exists()

    def test_handles_unicode(self, tmp_path):
        """Should write Unicode characters without escaping."""
        output = {"description": "Dépôt français 日本語"}
        output_path = tmp_path / "unicode.json"

        write_output(output, str(output_path))

        content = output_path.read_text(encoding="utf-8")
        assert "Dépôt français 日本語" in content
        assert "\\u" not in content
