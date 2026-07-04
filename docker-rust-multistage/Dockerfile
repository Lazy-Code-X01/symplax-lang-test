# Multi-stage Rust: compile a release binary, ship it on a slim Debian runner.
FROM rust:1.82-slim AS builder
WORKDIR /app
COPY Cargo.toml ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=builder /app/target/release/app ./app
ENV PORT=8080
EXPOSE 8080
CMD ["./app"]
