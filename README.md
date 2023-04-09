# TMDB-PAS-Assistant
TMDB Assistant for [PlexAniSync](https://github.com/RickDB/PlexAniSync/), specifically, for contribution to the [custom mappings](https://github.com/RickDB/PlexAniSync-Custom-Mappings) project.

## Installation
1. Clone the repository or download the source code
```bash
git clone https://github.com/Soitora/TMDB-PAS-Assistant.git
```
1. Install the dependencies
```bash
cd TMDB-PAS-Assistant
npm install
```

1. Copy the `.env.example` file to a new file called `.env` and add your TMDB API key.
```bash
cp .env.example .env
```

## Usage
To start the assistant, run the following command:
```bash
npm run assistant
```

## Scripts
- `assistant`: Runs the assistant script
- `debug`: Runs the debug script to see raw outputs
- `build`: Builds an executable file for Windows
- `patch`: Increments the patch version number and pushes the changes
- `minor`: Increments the minor version number and pushes the changes
- `major`: Increments the major version number and pushes the changes

## License
This project is licensed under the MPL-2.0 License - see the [LICENSE](./LICENSE) file for details.

## Issues
If you have any issues, please open a new issue in the [Issues](https://github.com/Soitora/TMDB-PAS-Assistant/issues) section of this repository.