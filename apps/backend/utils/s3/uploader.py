import boto3
import os
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

bucket = os.getenv("S3_BUCKET")
s3 = boto3.client("s3",config=Config(signature_version='s3v4'),region_name=os.getenv("AWS_REGION"))

def upload_bytes(key: str, content: bytes,content_type="text/plain"):
    try:
        s3.put_object(Bucket=bucket, Key=key, Body=content,ContentType=content_type)
        return f"File created Succesfully at {key}"
    except:
        return f"failed to create file at {key}"

def read_s3_bytes(key:str):
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        return response["Body"].read()
    except Exception as e:
        print(f"Error reading S3 key {key}: {e}")
        raise

def delete_s3_key(key: str):
    try:
        s3.delete_object(Bucket=bucket, Key=key)
        return True
    except Exception as e:
        print(f"Error deleting S3 key {key}: {e}")
        return False

def generate_presigned_url(key:str,expiration:int=3600):

    try:
        response = s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket, 'Key': key},
            ExpiresIn=expiration,
        )
        return response
    except Exception as e:
        print(f"error generating presigned url : {e}")
        return None
