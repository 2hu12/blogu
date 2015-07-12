# VERY HACK
GIT = $(shell cat config.json | grep -o \"git.*\" | cut -d"\"" -f4)
DOMAIN = $(shell cat config.json | grep -o \"domain.*\" | cut -d"\"" -f4)
init:
	if [ ! -d "dist" ]; then mkdir dist; fi && \
	cd dist && \
	if [ ! -z "${DOMAIN}" ]; then echo ${DOMAIN} > CNAME; fi && \
	if [ ! -d ".git" ]; then git init; fi && \
	if [ ! -z "${GIT}" ]; then git remote add origin ${GIT}; fi && \
	cd .. && npm install

addgit:
	if [ ! -d "dist" ]; then mkdir dist; fi && \
	cd dist && \
	if [ ! -z "${GIT}" ]; then git remote add origin ${GIT}; fi

adddomain:
	if [ ! -d "dist" ]; then mkdir dist; fi && \
	cd dist && \
	if [ ! -z "${DOMAIN}" ]; then echo ${DOMAIN} > CNAME; fi && \

post:
	gulp new --name "${name}" --silent

server:
	gulp server

s:
	gulp server --silent

gen:
	gulp gen

g:
	gulp gen --silent

NOW = $(shell date "+%Y-%m-%d %H:%M:%S")
deploy:
	cd dist && git add --all && git commit -a -m "Site Update: ${NOW}" && \
	git push -u origin master

d:
	cd dist && git add --all && git commit -a -m "Site Update: ${NOW}" && \
	git push -u origin master

dev:
	gulp dev

