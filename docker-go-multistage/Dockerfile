# Classic multi-stage: build a static binary, ship it on a tiny alpine runner.
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o app .

FROM alpine:3.19
WORKDIR /app
COPY --from=builder /app/app ./app
ENV PORT=8080
EXPOSE 8080
CMD ["./app"]
