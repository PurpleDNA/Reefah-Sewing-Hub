# Tiny image: just curl + the ping script. Runs once and exits.
FROM alpine:3.20

RUN apk add --no-cache curl

COPY ping.sh /ping.sh
RUN chmod +x /ping.sh

CMD ["/ping.sh"]
