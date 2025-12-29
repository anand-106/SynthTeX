import boto3
import os
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client("s3")
bucket = os.getenv("S3_BUCKET")

def read_s3_bytes(key:str):
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        return response["Body"].read()
    except Exception as e:
        print(f"Error reading S3 key {key}: {e}")
        raise

def upload_bytes(key: str, content: bytes,content_type="text/plain"):
    try:
        s3.put_object(Bucket=bucket, Key=key, Body=content,ContentType=content_type)
        return f"File created Succesfully at {key}"
    except:
        return f"failed to create file at {key}"