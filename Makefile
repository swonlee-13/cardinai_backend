SRCS = cardinai
ENV_FILE = ${SRCS}/confidential/.env
DOCKER_COMPOSE := $(shell echo "docker compose")

all: 
	-@$(DOCKER_COMPOSE) -f ./${SRCS}/docker-compose.yml --env-file ${ENV_FILE} up -d

build: 
	@$(DOCKER_COMPOSE) -f ./${SRCS}/docker-compose.yml --env-file ${ENV_FILE} build -d

down:
	@$(DOCKER_COMPOSE) -f ./${SRCS}/docker-compose.yml --env-file ${ENV_FILE} down -v

re: clean
	@$(DOCKER_COMPOSE) -f ./${SRCS}/docker-compose.yml --env-file ${ENV_FILE} up -d

clean: down
	@docker image ls | grep '${SRCS}' | awk '{print $$1}' | xargs docker image rm

fclean: down
	-@docker image ls | grep '${SRCS}' | awk '{print $$1}' | xargs docker image rm
	-@docker builder prune --force --all
	-@docker network prune --force
	-@docker system prune --force --all

.PHONY	: all build down re clean fclean dir