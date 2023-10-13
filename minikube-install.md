- navigate to https://minikube.sigs.k8s.io/docs/start/
- select the release to download.
Run the following commands from the terminal
- curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
- sudo install minikube-linux-amd64 /usr/local/bin/minikube
- go to the drivers page https://minikube.sigs.k8s.io/docs/drivers/

ensure docker groups are created and logged in user is part of that to avoid sudo.

Start a cluster using the docker driver:
- minikube start --driver docker

Check the status
- minikube status
output:
<code>minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured </code>

Healthcheck
- minikube dashboard

Install kuebctl
- minikube kubectl -- get po -A
- alias kubectl="minikube kubectl --"

Display all the nodes in a cluster
- kubectl get node
output:
<code>NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   11m   v1.27.4</code>

Display minikube IP address:
- minikube ip
