# Use nginx (already cached locally) to serve the static site
FROM nginx:alpine

# Copy website files to nginx's web root
COPY public/ /usr/share/nginx/html/

# nginx listens on 80
EXPOSE 80

# Run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
