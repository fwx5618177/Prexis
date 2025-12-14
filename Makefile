# Prexis Makefile

.PHONY: dev prod full down clean help

# 开发环境
dev:
	docker compose --profile dev up --build

# 生产环境
prod:
	docker compose --profile prod up -d --build

# 完整生产环境（含 Redis + Nginx）
full:
	docker compose --profile prod --profile cache --profile proxy up -d --build

# 停止所有服务
down:
	docker compose down -v --remove-orphans

# 清理镜像
clean:
	docker compose down --rmi all -v --remove-orphans

# 帮助
help:
	@echo "make dev   - 启动开发环境"
	@echo "make prod  - 启动生产环境"
	@echo "make full  - 完整生产环境（Redis + Nginx）"
	@echo "make down  - 停止服务"
	@echo "make clean - 清理所有镜像"
