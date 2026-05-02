"""
Single WeasyPrint entry point for HTML → PDF (lazy import).

Used by async export jobs and document templates so PDF behaviour and error
messages stay consistent across the product.
"""


def html_to_pdf_bytes(html_string: str) -> bytes:
    try:
        from weasyprint import HTML
    except OSError as exc:
        raise RuntimeError(
            'WeasyPrint system libraries are not installed. '
            'Use the project Docker image or install Pango, Cairo, and GDK-Pixbuf '
            'per https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#installation'
        ) from exc

    return HTML(string=html_string).write_pdf()


def html_to_pdf_file(html_string: str, file_path: str) -> None:
    """Write PDF bytes to ``file_path`` (parent dirs must exist)."""
    try:
        from weasyprint import HTML
    except OSError as exc:
        raise RuntimeError(
            'WeasyPrint system libraries are not installed. '
            'Use the project Docker image or install Pango/Cairo per WeasyPrint docs.'
        ) from exc

    HTML(string=html_string).write_pdf(file_path)
