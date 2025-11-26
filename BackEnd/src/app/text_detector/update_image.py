from botocore.exceptions import ClientError

def upload_to_s3(s3,bucket_source,image_bytes, filename):
    # Sube una imagen (bytes) al bucket origen
    try:
        s3.Object(bucket_source, filename).put(Body=image_bytes)
    except ClientError as e:
        raise Exception(f"Error subiendo imagen a S3: {e}")