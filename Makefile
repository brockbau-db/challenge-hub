.PHONY: help
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo
	@echo 'Targets:'
	@egrep '^(.+)\:\ ##\ (.+)' ${MAKEFILE_LIST} | column -t -c 2 -s ':#'

.PHONY: install
install: ## Install all dependencies (backend and frontend)
	uv sync
	cd challenge-hub-ui && npm install

.PHONY: start-backend
start-backend: ## Start the FastAPI backend server
	uv run uvicorn main:app --reload

.PHONY: start-frontend
start-frontend: ## Start the React frontend dev server
	cd challenge-hub-ui && npm run dev

.PHONY: start
start: ## Start both backend and frontend servers
	@echo "Starting backend server..."
	@uv run uvicorn main:app --reload &
	@echo "Starting frontend server..."
	@cd challenge-hub-ui && npm run dev
