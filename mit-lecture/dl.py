from __future__ import annotations

import argparse
import re
from urllib.request import urlopen


def download_contents(url: str) -> str:
    with urlopen(url) as response:
        body: str = response.read().decode("utf-8")
        return body


def extract(content: str) -> list[str]:
    pattern = r"\[.*?\]\((.*?)\)"
    return re.findall(pattern, content)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download a URL and extract markdown links.")
    parser.add_argument("url", help="URL to download and extract links from")
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = parse_args(argv)
    content = download_contents(args.url)
    links = extract(content)
    for link in links:
        print(link)


if __name__ == "__main__":
    main()
