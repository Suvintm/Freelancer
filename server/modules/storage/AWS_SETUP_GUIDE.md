# 🏛️ AWS S3 PRODUCTION SETUP GUIDE (PRIVATE & SECURE)

Follow these steps in your **AWS Console** to ensure your S3 bucket is private, secure, and ready for high-performance media serving.

---

## 1. 🛡️ Block Public Access (CRITICAL)
Your bucket should NOT be public. 
- Go to **S3 Console** → **[Your Bucket]** → **Permissions** tab.
- Find **Block public access (bucket settings)**.
- Ensure **"Block all public access"** is checked (ON).

---

## 2. 📜 Bucket Policy (For CDN access)
To allow Cloudflare (or CloudFront) to read your files while keeping the bucket private, you must add a policy. Copy and paste this into the **Bucket policy** editor:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "AllowCDNRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::[YOUR_BUCKET_NAME]/*",
            "Condition": {
                "IpAddress": {
                    "aws:SourceIp": [
                        "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", 
                        "103.31.4.0/22", "141.101.64.0/18", "108.162.192.0/18", 
                        "190.93.240.0/20", "188.114.96.0/20", "197.234.240.0/22", 
                        "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13", 
                        "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22"
                    ]
                }
            }
        }
    ]
}
```
*Note: This specific policy (SourceIp) allows only Cloudflare's IP range to read from your bucket. This is the most professional way to keep it private but still serve via CDN.*

---

## 🌐 3. CORS Configuration (For Direct Uploads)
To allow your mobile app or frontend to upload files directly to S3 (Phase 4), you must enable CORS. Paste this into the **CORS** editor:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"],
        "MaxAgeSeconds": 3000
    }
]
```
*Tip: In production, you should replace `"*"` in `AllowedOrigins` with your actual domain (e.g., `https://suvix.in`).*

---

## 🔁 4. Lifecycle Rules (Save Money 💰)
Social apps generate a lot of "trash" (temp files).
- Go to **Management** tab → **Create lifecycle rule**.
- **Rule 1: Cleanup Raw Originals**
  - Prefix: `raw/`
  - Action: **Expire current versions of objects**
  - Days after creation: **1 day**
- **Rule 2: Move to Infrequent Access**
  - Prefix: `images/`
  - Action: **Move to Standard-IA**
  - Days after creation: **30 days**

---

## 🔑 5. IAM User Credentials
You need an Access Key and Secret for our backend.
- Go to **IAM Console** → **Users** → **Create user**.
- Name: `suvix-storage-worker`.
- Attach Policy: **AmazonS3FullAccess** (or a custom policy scoped only to your bucket).
- Security Credentials → **Create access key** → **Local code**.
- Save the `ID` and `SECRET` for your `.env` file!

---

🎯 **Once these 5 steps are done, your S3 is truly Production Level and 100% Private!**
