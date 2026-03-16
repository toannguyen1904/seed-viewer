
####################################################################################

#### build frontend

ARG NODE_VERSION=20.10.0

FROM node:$NODE_VERSION-alpine AS node_stage

WORKDIR /project

COPY frontend/package.json frontend/package-lock.json ./

RUN npm install

COPY frontend/ .

RUN npm run build


####################################################################################

#### build python dependencies

FROM python:3.11.9-slim AS pdm_stage

# install PDM
RUN pip install -U pdm

# disable pdm update check
ENV PDM_CHECK_UPDATE=false

# install dependencies and project into the local packages directory
WORKDIR /project

# copy files
COPY backend/pyproject.toml backend/pdm.lock  ./

RUN pdm install --check --prod --no-editable


####################################################################################

FROM python:3.11.9-slim

# Set the working directory
WORKDIR /usr/src/app

#  copy .venv so that it becomes the default python interpreter
COPY --from=pdm_stage /project/.venv/ /usr/src/app/.venv
ENV PATH="/usr/src/app/.venv/bin:$PATH"

# copy frontend build
COPY --from=node_stage /project/public/dist/ ./dist

COPY backend/src .

CMD [ "python", "main.py" ]
