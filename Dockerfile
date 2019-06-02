FROM node:current-slim

RUN echo "Etc/UTC" > /etc/timezone && dpkg-reconfigure -f noninteractive tzdata

ADD build /opt/app/
WORKDIR /opt/app
RUN npm install

CMD ["node", "index.js"]
