<h1 align="center">SketCherry</h1>

<div align="center"><img src="./frontend/public/logo.png" alt="SketCherry" width="200"></div>

---

**SketCherry** is a simple online graphic editor that empowers anyone – **_regardless of design experience_** – to effortlessly create stunning visuals.
The project was developed as a solution to the **Webster** challenge of the **Innovation Campus educational program**.

TODO screenshots

## Features

TODO

## Technology Stack

All you need preinstalled is [**Docker**](https://www.docker.com/) (and we recommend to have [**Node.js**](https://nodejs.org/en)).

- Backend: Nest.js, PostgreSQL, TypeORM, Swagger, JWT, Google APIs, Nodemailer, Multer
- Frontend: React, Vite, Redux Toolkit, CSS, Konva, Zod, Axios, React Aria
- Docker

## How to use

Clone the repository to your local machine and navigate to the project directory:

```bash
git clone https://github.com/VeronikaSukhonos/webster.git
cd webster
```

Create `.env` file with the variables specified in [`.env.example`](./.env.example) file.

You can get `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in [**Google Cloud console**](https://console.cloud.google.com/).

If you want to send emails via API and use a cloud storage for files, you need to get [**Promailer API key**](https://www.promailer.xyz) and have [**Cloudflare R2 Object Storage**](https://www.cloudflare.com/products/r2/), where you must create a dedicated bucket and copy `files` directory from the [`backend`](./backend/) to it.

### Build the project

Launch Docker, and, in the same directory where [`docker-compose.yml`](./docker-compose.yml) file is located, run the command:

```
docker compose build <app-dev/app-prod>
```

Specify `app-dev` to run the development build, where you can change files both in [`backend`](./backend/) and [`frontend`](./frontend/) directories (except Docker-related files), and servers will be restarted automatically.

Specify `app-prod` to run the production build, but before that you must change some lines in [`nginx.conf`](./nginx.conf):

- line 9 must look like `server_name localhost;`
- line 18 must look like `proxy_pass http://localhost:8080/;`

### Run the app

To run the app, use the following command (it will also build the app first if not yet):

```
docker compose up <app-dev/app-prod>
```

**API server** will run at:

- [`http://localhost:3000`](http://localhost:3000) (development build)
- [`http://localhost:8080`](http://localhost:8080) (production build)

**Web application** will run at:

- [`http://localhost:5173`](http://localhost:5173) (development build)
- [`http://localhost:8000`](http://localhost:8000) (production build)

### Stop the app

When you are done, tear the app down by using the command:

```
docker compose down
```

## Deployment on Render

The project is also deployed on [**Render**](https://render.com/):

- [`https://sketcherry.onrender.com`](https://sketcherry.onrender.com) (web app)
- [`https://sketcherry-api.onrender.com/api`](https://sketcherry-api.onrender.com/api) (API)

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

Also, the backend exposes a **Swagger Ul** page accessible via:

- [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs) (development build)
- [`http://localhost:8080/api/docs`](http://localhost:8080/api/docs) (production build)
- [`https://sketcherry-api.onrender.com/api/docs`](https://sketcherry-api.onrender.com/api/docs) (Render deployment)
