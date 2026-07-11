https://www.learnlinux.tv/getting-started-with-kestra-install-configure-and-automate/
Preliminary Setup
Refresh the package repository index

apt update
Install updates

apt dist-upgrade
Edit the hostname file to set the hostname

nano /etc/hostname
Edit the hosts file for name resolution

nano /etc/hosts
Create a non-root user account

adduser jay
Add your user to the sudo group

usermod -aG sudo jay
Setting up Docker
Add the required GPG key for the repository:

sudo curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
Add Docker’s repository

sudo nano /etc/apt/sources.list.d/docker.sources

Inside the file, we’ll add the configuration for Docker’s repository:

Types: deb
URIs: https://download.docker.com/linux/debian
Suites: trixie
Components: stable
Architectures: amd64
Signed-By: /etc/apt/keyrings/docker.asc

Refresh our package cache again:

sudo apt update
Install required packages for Docker:

sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin
Run the “Hello World” Container to test Docker:

sudo docker run hello-world
Add your user to the docker group:

sudo usermod -aG docker jay
Installing Kestra
Download the Docker Compose file for Kestra:

curl -o docker-compose.yml \
https://raw.githubusercontent.com/kestra-io/kestra/develop/docker-compose.yml
Edit the Docker Compose file and set up basic auth:

nano docker-compose.yml
Launch Kestra:

docker compose up -d
First Flow: HTTP Health Check

id: http-health-check
namespace: learnlinux.tv

description: |
  Checks that a list of URLs return HTTP 200.
  Sends an email notification if any site is down.

triggers:
  - id: every-5-minutes
    type: io.kestra.plugin.core.trigger.Schedule
    cron: "*/5 * * * *"

tasks:
  - id: check-learnlinux-tv
    type: io.kestra.plugin.fs.http.Request
    uri: https://learnlinux.tv
    method: GET
    allowFailed: true

  - id: notify-if-down
    type: io.kestra.plugin.email.MailSend
    runIf: "{{ outputs['check-learnlinux-tv'].code is defined and outputs['check-learnlinux-tv'].code != 200 }}"
    from: infra-alerts@mail.learnlinux.cloud
    to: jay@learnlinux.tv
    username: "{{ secret('MAIL_USERNAME') }}"
    password: "{{ secret('MAIL_PASSWORD') }}"
    host: smtp.mailgun.org
    port: 587
    transportStrategy: SMTP_TLS
    subject: "Kestra: learnlinux.tv is DOWN"
    htmlTextContent: |
      <p>Site returned unexpected status: {{ outputs['check-learnlinux-tv'].code }}</p>
      <p>Checked at: {{ execution.startDate }}</p>

errors:
  - id: notify-on-error
    type: io.kestra.plugin.email.MailSend
    from: infra-alerts@mail.learnlinux.cloud
    to: jay@learnlinux.tv
    username: "{{ secret('MAIL_USERNAME') }}"
    password: "{{ secret('MAIL_PASSWORD') }}"
    host: smtp.mailgun.org
    port: 587
    transportStrategy: SMTP_TLS
    subject: "Kestra: learnlinux.tv check FAILED"
    htmlTextContent: |
      <p>The health check failed with an error (DNS failure or connection refused).</p>
      <p>Checked at: {{ execution.startDate }}</p>

Second Flow: Running commands against a server
Create an SSH key:

ssh-keygen -t ed25519 -C “kestra” -f ~/.ssh/kestra_key
Encode the key in base64:

cat ~/.ssh/id_ed25519_kestra | base64 -w 0

Associate the key with your second server:

ssh-copy-id -i ~/.ssh/kestra_key 45.79.213.183

At this point, we shouldn’t need to be logged in as root anymore, so we can exit the root session:
Flow code for the second example

id: ansible-run-linode-provision
namespace: learnlinux.homelab
description: |
  Runs a command on a remote Linode VPS via SSH.

tasks:
  - id: run-remote-command
    type: io.kestra.plugin.fs.ssh.Command
    authMethod: OPEN_SSH
    host: 45.79.213.183
    username: jay
    privateKey: "{{ secret('SSH_PRIVATE_KEY') }}"
    commands:
      - cat /etc/os-release