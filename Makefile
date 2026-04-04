.PHONY: dev dev-desktop build lint test db-generate db-push db-seed

dev:
	npm run dev

dev-desktop:
	npm run dev:desktop

build:
	npm run build

lint:
	npm run lint

test:
	npm run test

db-generate:
	npm run prisma:generate --workspace server

db-push:
	npx prisma db push --schema server/prisma/schema.prisma

db-seed:
	npm run prisma:seed --workspace server
