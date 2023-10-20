create the configmap using template from https://kubernetes.io/docs/concepts/configuration/configmap/
create secrets file using template from https://kubernetes.io/docs/concepts/configuration/secret/

base64 encode username and password: 
    echo -n mongouser | base64
    echo -n monogpassword | base64

create a deployment+services file using template from https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
seperate the deployment from services in the yaml with ---
create the services from https://kubernetes.io/docs/concepts/services-networking/service/

create the webapp deployment+services file
    use container image nanajanashia/k8s-demo-app

pass env variables and secrets into the deployment files

minikube start --driver docker
alias kubectl="minikube kubectl --"
kubectl get pod
kubectl apply -f mongo-config.yaml
kubectl apply -f mongo-secret.yaml
kubectl apply -f mongo.yaml



