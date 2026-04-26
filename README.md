<h1 align="center">SketCherry</h1>

<div align="center"><img src="./frontend/public/logo.png" alt="SketCherry" width="200"></div>

---

**SketCherry** is a simple online graphic editor that empowers anyone - **_regardless of design experience_** - to effortlessly create stunning visuals.
The project was developed as a solution to the **Webster** challenge of the **Innovation Campus educational program**.

TODO screenshots

## Features

TODO

## Technology Stack

All you need preinstalled is [Docker](https://www.docker.com/) (and we recommend to have [Node.js](https://nodejs.org/en)).

- Backend: Nest.js, PostgreSQL, TypeORM, Swagger, JWT, Google APIs, Nodemailer, Multer
- Frontend: React, Vite, Redux Toolkit, CSS, Konva, Zod, Axios
- Docker

## How to use

Clone the repository to your local machine and navigate to the project directory:

```bash
git clone https://github.com/VeronikaSukhonos/webster.git
cd webster
```

Create `.env` file with the variables specified in `.env.example` file.

### Build the project

Launch Docker, and, in the same directory where `docker-compose.yml` file is located, run the command:

```
docker compose build <app-dev/app-prod>
```

Specify `app-dev` to run the development build and `app-prod` to run the production build.

In the development build, you can change files both in `backend` and `frontend` directories (except Docker-related files), and servers will be restarted automatically.

### Run the app

To run the app, use the following command (it will also build the app first if not yet):

```
docker compose up <app-dev/app-prod>
```

**API server** will run at:

- [`http://localhost:3000`](http://localhost:3000) in the development build
- [`http://localhost:8080`](http://localhost:8080) in the production build

**Web application** will run at:

- [`http://localhost:5173`](http://localhost:5173) in the development build
- [`http://localhost:8000`](http://localhost:8000) in the production build

### Stop the app

When you are done, tear the app down by using the command:

```
docker compose down
```

## Team

- [**Polina Rezchyk**](https://github.com/BekkaMushko)
- [**Yevheniia Rezchyk**](https://github.com/EvgeniaRezchik)
- [**Veronika Sukhonos**](https://github.com/VeronikaSukhonos)
- [**Denys Mykhailov**](https://github.com/MSTWNTED)

## Documentation

General project documentation can be found [here](./docs/) and contains:

- description of our experience (activities, findings, problems, conclusions) while working on a project according to Challenge Based Learning (CBL) framework
- useful diagrams describing the work of the application
- screenshots of features

Also, the backend exposes a **Swagger Ul** page accessible via [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs).
