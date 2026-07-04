# Static site on nginx:alpine — a very common real-world "bring your own Dockerfile" case.
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
