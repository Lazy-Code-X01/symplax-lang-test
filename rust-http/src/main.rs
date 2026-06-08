use actix_web::{get, App, HttpResponse, HttpServer, Responder};
use std::env;

#[get("/")]
async fn index() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({
        "message": "Rust on Symplax",
        "status": "ok"
    }))
}

#[get("/health")]
async fn health() -> impl Responder {
    HttpResponse::Ok().json(serde_json::json!({"status": "ok"}))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port: u16 = env::var("PORT").unwrap_or_else(|_| "3000".to_string()).parse().unwrap_or(3000);
    println!("Rust server running on port {}", port);
    HttpServer::new(|| App::new().service(index).service(health))
        .bind(("0.0.0.0", port))?
        .run()
        .await
}
