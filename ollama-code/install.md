1. **Install and start Ollama natively:** Mac Terminal.
Install Ollama via Homebrew or download the macOS installer from `ollama.com`:

```bash
brew install --cask ollama-app

```

Launch the **Ollama** app from your Applications folder so it runs natively with full M3 GPU acceleration.


2. **Download your chosen models:** Terminal.
Pull a lightweight chat model and a dedicated coding model:

```bash
ollama pull llama3
ollama pull qwen2.5-coder:7b

```


3. **Launch Open WebUI via Docker:** Terminal.
Run this command to deploy the web interface and route it to your native Ollama host:

```bash
docker run -d -p 3000:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:main

```

Open `http://localhost:3000` in your browser to complete a quick local admin setup.


4. **Set up Continue in VS Code:** VS Code.
1. Search for and install the **Continue** extension from the VS Code Marketplace.
2. Open the Continue panel, select **Ollama** as your provider, and set the model to `qwen2.5-coder:7b`.
3. Ensure the API URL points to `http://localhost:11434`.


---

Continue yaml
name: Main Config
version: 1.0.0
schema: v1
models:
  # - name: Llama 3.1 8B
  #   provider: ollama
  #   model: llama3.1:8b
  #   roles:
  #     - chat
  #     - edit
  #     - apply
  - name: Qwen2.5 Coder 7b
    provider: ollama
    model: qwen2.5-coder:7b
    roles:
      - autocomplete
  - name: Autodetect
    provider: ollama
    model: AUTODETECT
    roles:
      - chat
      - edit
      - apply
