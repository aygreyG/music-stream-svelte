#!/usr/local/bin/python3

import sys
import json
import docker


def parse_payload():
    payload = sys.argv[1]
    payload_parsed = json.loads(payload)
    tag = payload_parsed["tag"]
    print(f"Getting {tag}...")
    return tag


def main():
    tag = parse_payload()

    if tag == "":
        print("Tag is empty, getting latest version...")
        tag = "latest"

    if tag.__contains__("main"):
        print("Redeploying production container...")
        name = f"svelte-music-stream"
        volumes = {"/path/to/music": {"bind": "/app/music", "mode": "rw"}}
        environment = ["DATABASE_URL=postgresql://user:password@host:port/dbname"]
        ports = {"3000/tcp": "3000"}
    else:
        print("Deploying development container...")
        name = f"svelte-music-stream_dev"
        volumes = {"/path/to/music": {"bind": "/app/music", "mode": "rw"}}
        environment = ["DATABASE_URL=postgresql://user:password@host:port/dbname"]
        ports = {"3000/tcp": "3001"}

    client = docker.from_env()
    try:
        container = client.containers.get(name)
        container.stop()
        print("Stopped current version")
    except:
        pass
    client.containers.prune()
    print("Removed current version")

    client.containers.run(
        f"aygreyg/svelte-music-stream:{tag}",
        detach=True,
        volumes=volumes,
        environment=environment,
        ports=ports,
        name=name,
        restart_policy={"Name": "on-failure", "MaximumRetryCount": 5},
    )
    print(f"Tag {tag} was deployed successfully")


if __name__ == "__main__":
    main()
