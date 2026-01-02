# Kaizen Studio Load Testing Makefile
#
# Convenient shortcuts for running load tests
#
# Usage:
#   make smoke              # Run smoke test on local
#   make smoke-staging      # Run smoke test on staging
#   make stress-staging     # Run stress test on staging
#   make all-staging        # Run all tests on staging
#   make install            # Install k6
#   make clean              # Clean up reports

.PHONY: help install check smoke auth agents pipelines stress spike soak all clean

# Default target
help:
	@echo "Kaizen Studio Load Testing"
	@echo ""
	@echo "Quick Commands:"
	@echo "  make smoke              - Smoke test on local (30s)"
	@echo "  make smoke-staging      - Smoke test on staging (30s)"
	@echo "  make auth-staging       - Auth test on staging (4m)"
	@echo "  make stress-staging     - Stress test on staging (20m)"
	@echo "  make all-staging        - All tests on staging"
	@echo ""
	@echo "Setup:"
	@echo "  make install            - Install k6"
	@echo "  make check              - Check dependencies"
	@echo ""
	@echo "Cleanup:"
	@echo "  make clean              - Remove reports"
	@echo "  make clean-all          - Remove all generated files"

# Check dependencies
check:
	@echo "Checking dependencies..."
	@which k6 > /dev/null || (echo "k6 not found. Run 'make install'" && exit 1)
	@echo "✓ k6 is installed ($$(k6 version))"

# Install k6
install:
	@echo "Installing k6..."
	@if [ "$$(uname)" = "Darwin" ]; then \
		brew install k6; \
	elif [ "$$(uname)" = "Linux" ]; then \
		sudo apt-get update && sudo apt-get install -y k6; \
	else \
		echo "Unsupported OS. Please install k6 manually: https://k6.io/docs/getting-started/installation/"; \
		exit 1; \
	fi
	@echo "✓ k6 installed successfully"

# Smoke tests
smoke: check
	./run-loadtest.sh smoke local

smoke-dev: check
	./run-loadtest.sh smoke development

smoke-staging: check
	./run-loadtest.sh smoke staging --html

smoke-prod: check
	@echo "WARNING: Running smoke test on PRODUCTION"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		./run-loadtest.sh smoke production --html; \
	fi

# Authentication tests
auth: check
	./run-loadtest.sh auth local

auth-dev: check
	./run-loadtest.sh auth development

auth-staging: check
	./run-loadtest.sh auth staging --html

# Agent tests
agents: check
	./run-loadtest.sh agents local

agents-dev: check
	./run-loadtest.sh agents development

agents-staging: check
	./run-loadtest.sh agents staging --html

# Pipeline tests
pipelines: check
	./run-loadtest.sh pipelines local

pipelines-dev: check
	./run-loadtest.sh pipelines development

pipelines-staging: check
	./run-loadtest.sh pipelines staging --html

# Stress tests
stress: check
	@echo "WARNING: This will ramp up to 500 VUs"
	./run-loadtest.sh stress local

stress-staging: check
	@echo "Running stress test on staging (20 minutes)"
	./run-loadtest.sh stress staging --html

# Spike tests
spike: check
	@echo "WARNING: This will spike to 1000 VUs"
	./run-loadtest.sh spike local

spike-staging: check
	@echo "Running spike test on staging (7 minutes)"
	./run-loadtest.sh spike staging --html

# Soak tests
soak: check
	@echo "WARNING: This will run for 30 minutes"
	./run-loadtest.sh soak local

soak-staging: check
	@echo "Running soak test on staging (30+ minutes)"
	./run-loadtest.sh soak staging --html

# Run all tests
all: check
	@echo "Running all tests on local (this will take ~1 hour)"
	./run-loadtest.sh all local --html

all-dev: check
	@echo "Running all tests on development"
	./run-loadtest.sh all development --html

all-staging: check
	@echo "Running all tests on staging (this will take ~1 hour)"
	./run-loadtest.sh all staging --html

# CI/CD shortcuts
ci-smoke: check
	./run-loadtest.sh smoke staging

ci-full: check
	./run-loadtest.sh smoke staging --html
	./run-loadtest.sh auth staging --html
	./run-loadtest.sh agents staging --html
	./run-loadtest.sh pipelines staging --html

ci-nightly: check
	./run-loadtest.sh stress staging --html
	./run-loadtest.sh spike staging --html

# Kubernetes
k8s-deploy:
	kubectl apply -f k8s-loadtest-job.yaml

k8s-logs:
	kubectl logs -f job/kaizen-studio-loadtest-smoke -n kaizen-studio

k8s-clean:
	kubectl delete -f k8s-loadtest-job.yaml

# Cleanup
clean:
	@echo "Cleaning up reports..."
	rm -rf reports/*.html
	rm -rf reports/*.json
	rm -rf reports/*.txt
	rm -rf reports/*.xml
	@echo "✓ Reports cleaned"

clean-all: clean
	@echo "Cleaning all generated files..."
	rm -rf reports/*
	@echo "✓ All clean"

# View latest report
view-report:
	@latest=$$(ls -t reports/*.html 2>/dev/null | head -1); \
	if [ -n "$$latest" ]; then \
		echo "Opening $$latest"; \
		if [ "$$(uname)" = "Darwin" ]; then \
			open "$$latest"; \
		elif [ "$$(uname)" = "Linux" ]; then \
			xdg-open "$$latest"; \
		fi; \
	else \
		echo "No reports found. Run a test first."; \
	fi

# Show latest summary
summary:
	@latest=$$(ls -t reports/*_summary.json 2>/dev/null | head -1); \
	if [ -n "$$latest" ]; then \
		echo "Latest Summary: $$latest"; \
		echo ""; \
		cat "$$latest" | jq '.metrics | {http_req_duration, http_req_failed, success_rate}'; \
	else \
		echo "No summaries found. Run a test first."; \
	fi
