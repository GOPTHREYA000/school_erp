from storages.backends.s3boto3 import S3Boto3Storage


class PrivateMediaStorage(S3Boto3Storage):
    """
    Private media storage for sensitive files (student photos, documents, ID cards).
    Files are NOT publicly accessible. Django generates time-limited signed URLs
    when a permitted user requests to view/download a file.
    """
    location = 'media'
    default_acl = 'private'
    file_overwrite = False
    querystring_auth = True        # Generate signed URLs
    querystring_expire = 3600      # URLs expire in 1 hour


class PublicStaticStorage(S3Boto3Storage):
    """
    Public storage for static assets (CSS, JS, fonts).
    These are safe to serve publicly via CDN.
    """
    location = 'static'
    default_acl = 'public-read'
    file_overwrite = True
    querystring_auth = False       # No signing needed for public assets
