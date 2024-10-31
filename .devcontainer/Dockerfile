FROM node:20

# Install basic development tools
RUN apt update && apt install -y less man-db sudo

# Ensure default `node` user has access to `sudo`
ARG USERNAME=node
RUN echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME



# Set `DEVCONTAINER` environment variable to help with orientation
ENV DEVCONTAINER=true
# Run NPM installs - saj
WORKDIR /workspaces/code/nodejs/crud-demo
COPY ./ ./
# RUN npm install
# COPY ../nodejs/crud-demo/ .
EXPOSE 5173
CMD ["npm", "run", "dev"]
