from __future__ import annotations

from io import BytesIO
from unittest.mock import patch, MagicMock
import pytest

from dl import download_contents, extract, parse_args, main


def test_extract_finds_markdown_links() -> None:
    content = "Check [Google](https://google.com) and [GitHub](https://github.com)."
    assert extract(content) == ["https://google.com", "https://github.com"]


def test_extract_empty() -> None:
    assert extract("no links here") == []


def test_download_contents() -> None:
    fake_response = MagicMock()
    fake_response.read.return_value = b"hello world"
    fake_response.__enter__ = MagicMock(return_value=fake_response)
    fake_response.__exit__ = MagicMock(return_value=False)

    with patch("dl.urlopen", return_value=fake_response):
        result = download_contents("https://example.com")

    assert result == "hello world"


def test_parse_args_url() -> None:
    ns = parse_args(["https://example.com"])
    assert ns.url == "https://example.com"


def test_main_prints_links(capsys: pytest.CaptureFixture[str]) -> None:
    html = "Visit [Site](https://site.com) now."

    with patch("dl.download_contents", return_value=html):
        main(["https://example.com"])

    captured = capsys.readouterr()
    assert "https://site.com" in captured.out
