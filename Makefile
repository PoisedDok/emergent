.PHONY: setup fix-perms build up down update clean

setup:
	git submodule update --init --recursive
	mkdir -p config/headscale config/unbound config/torproxy config/adguard
	mkdir -p data/headscale data/adguard/work data/adguard/conf data/torproxy/data
	cp config/adguard/AdGuardHome.yaml.example data/adguard/conf/AdGuardHome.yaml
	touch data/headscale/db.sqlite
	@echo "Setup complete. Please review .env and configs before running 'make build'."

fix-perms:
	@echo "Securing data directory permissions (God-Level Security)..."
	docker run --rm -v $(PWD)/data/torproxy/data:/var/lib/tor alpine sh -c 'chown -R 1000:1000 /var/lib/tor && chmod -R 700 /var/lib/tor'
	chmod 777 data/headscale

build:
	@echo "Building custom images from submodules..."
	docker compose build

up: fix-perms
	docker compose up -d

down:
	docker compose down

update:
	git submodule update --remote --merge
	docker compose build
	$(MAKE) up

clean:
	docker compose down -v
	rm -rf data/headscale/* data/adguard/work/* data/adguard/conf/* data/torproxy/data/*
