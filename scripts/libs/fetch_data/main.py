import argparse
import os
import sys

from lib.config import CONFIG_FILE, OUTPUT_FILE, load_config
from lib.fetcher import fetch_all_repos
from lib.transformer import build_output, process_repos, write_output

def main():
    parser = argparse.ArgumentParser(description="Fetch GitHub data for showcase site")
    parser.add_argument(
        "--config",
        default=str(CONFIG_FILE),
        help="Path to config.json (default: config.json)",
    )
    parser.add_argument(
        "--output",
        default=str(OUTPUT_FILE),
        help="Output path for generated JSON (default: site/data/repos.json)",
    )
    parser.add_argument(
        "--with-languages",
        action="store_true",
        help="Fetch language breakdown per repo (slower, more API calls)",
    )
    args = parser.parse_args()

    config = load_config(args.config)
    github_config = config["github"]
    site_config = config["site"]

    token_env = github_config.get("token_env", "GITHUB_TOKEN")
    token = os.environ.get(token_env)
    if not token:
        print(f"Error: Environment variable {token_env} is not set.", file=sys.stderr)
        print("Export your GitHub token: export GITHUB_TOKEN=ghp_xxxxx", file=sys.stderr)
        sys.exit(1)

    exclude_repos = set(github_config.get("exclude_repos", []))
    pinned_repos = github_config.get("pinned_repos", [])

    print("Fetching repositories...")
    unique_repos = fetch_all_repos(github_config.get("sources", []), token, exclude_repos, )

    print(f"Processing {len(unique_repos)} repositories...")
    repos_data, owner_avatars = process_repos(unique_repos, token, pinned_repos, args.with_languages)

    output = build_output(repos_data, owner_avatars, site_config)
    output_path = write_output(output, args.output)

    print(f"\nDone! Generated {output_path} with {len(repos_data)} repositories.")

if __name__ == "__main__":
    main()
