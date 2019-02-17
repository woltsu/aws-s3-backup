## aws-s3-backup
A node script that checks for changed files in a folder and then stores them into an S3 bucket.  
### Prerequisites
1. Node.js
2. AWS account
3. S3 bucket
### How to use
1. Clone repository
2. Locate the file `config.json` and add the required information
3. Obtain `aws_access_key_id`, `aws_secret_access_key` and `aws_session_token` from your AWS account information and put them into ` ~/.aws/credentials` file
4. Create a cron job for the scrip, f.ex. `*/4 * * * *  /usr/local/bin/node ~/aws-s3-backup/index.js` runs the script every 4 minutes
5. Enable versioning in the S3 bucket in order to have a safer backup (optional)
6. Add a lifecycle rule to remove old versions in x amount of days to not bloat the bucket (optional)
