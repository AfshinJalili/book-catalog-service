# Book Catalog Service

This project is a Node.js back-end service that provides a catalog of books. It uses gRPC for communication, Redis for caching, and JSON files for data storage. The service allows users to list books, get details of a specific book, and delete a book from the catalog.

## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Service](#running-the-service)
- [Using the Service](#using-the-service)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- Node.js (v14 or higher)
- Redis (v5 or higher)

### Installation

1. Clone the repository:
git clone https://github.com/yourusername/book-catalog-service.git

2. Navigate to the project directory:
cd book-catalog-service

3. Install the dependencies:
npm install


## Running the Service

1. Start the Redis server.
2. Run the service:
npm start


## Using the Service

The service provides the following gRPC methods:

- `ListBooks`: Lists all books in the catalog.
- `GetBookDetails`: Retrieves the details of a specific book by its ID.
- `DeleteBook`: Deletes a book from the catalog by its ID.

## Contributing

Contributions are welcome! Please read the [contributing guidelines](CONTRIBUTING.md) for details on how to contribute to this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.