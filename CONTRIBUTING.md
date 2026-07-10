# Contributing

Thanks for considering contributing to **cardinal**! Here’s how you can help:

## How to Contribute
1. **Fork** the repository
2. **Clone** your fork locally
3. Create a **new branch** for your feature or bug fix
4. Make your changes and **write tests** for them
5. Update the **manifest.yaml** to include your changes
5. **Commit** your changes with a descriptive message
6. Push your changes to your fork and create a **pull request**

## Issues
- If you find a bug or need a feature, please open an **issue**.
- Please search the issue tracker to avoid duplicates.

## Code Style
- Ensure that your code passes existing tests and includes new ones for new features or fixes

## Development Environment
- Use Python 3.8 or higher
- Set up a virtual environment for development with `python -m venv venv`
- Install dependencies with `pip install -r requirements.txt`
- Install development dependencies with `pip install -r requirements-dev.txt`
- Generate data with `python scripts/libs/fetch_data/main.py --with-languages`
- Serve the website locally with `python -m http.server 8080 --directory src/`

## File Architecture
- The website code is in the `src` directory
- Data generation python scripts are in the `scripts/libs/fetch_data` directory

## Testing
Make sure your changes pass the tests. You can run the tests with:

```bash
pytest scripts/tests/ --cov=scripts/libs --cov-report=term-missing
```
## License

By contributing, you agree that your contributions will be licensed under the AGPL License -- see the [LICENSE](LICENSE) file for details.
