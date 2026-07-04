import com.sun.net.httpserver.HttpServer;

import java.io.OutputStream;
import java.net.InetSocketAddress;

// Pure JDK HTTP server (no external deps) so the Maven build stays minimal.
public class App {
    public static void main(String[] args) throws Exception {
        String env = System.getenv("PORT");
        int port = (env != null && !env.isEmpty()) ? Integer.parseInt(env) : 8080;

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/", exchange -> {
            String body = "{\"ok\":true,\"app\":\"java-maven\"}";
            exchange.getResponseHeaders().set("Content-Type", "application/json");
            byte[] bytes = body.getBytes();
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        });
        server.start();
        System.out.println("listening on " + port);
    }
}
