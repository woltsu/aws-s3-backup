// Imports
const fs = require('fs')
const { promisify } = require('util')
const child_process = require('child_process')
const aws = require('aws-sdk')
const config = require('./config.json')
const store = require('./store.json')
const { bucket, target } = config

// Promisify functions
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)
const exec = promisify(child_process.exec)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)

// Setup s3
const s3 = new aws.S3()

// Returns all files from the target directory
const getFiles = async () => {
  const files = []
  try {
    const items = await readdir(target)
    for (const item of items) {
      const stats = await stat(`${target}/${item}`)
      if (!stats.isDirectory()) files.push(item)
    }
    return files
  } catch (e) {
    console.log('Error reading files')
    process.exit(1)
  }
}

// Returns all files that have been changed or do not exist in s3
const getChangedFiles = async () => {
  const changedFiles = []
  const files = await getFiles()
  for (const file of files) {
    try {
      await s3.getObject({
        Bucket: bucket,
        Key: file
      }).promise()
      if (await hasFileBeenChanged(`${target}/${file}`)) changedFiles.push(file)
    } catch (e) {
      changedFiles.push(file)
    }
  }
  return changedFiles
}

// Returns true if a file has been changed since the last check
const hasFileBeenChanged = async (file) => {
  if (store.prev) {
    let timeSinceLastCheck = new Date(Date.now() - store.prev).getMinutes() + 2
    const p = await exec(`find ${file} -mmin -${timeSinceLastCheck}`)
    return p.stdout ? true : false
  }
  return true
}

// Saves files to the given s3 bucket, returns
// 0 if there were errors and 1 otherwise
const saveFiles = async (files) => {
  let errFlag = false
  for (const file of files) {
    const filePath = `${target}/${file}`
    const fileContents = await readFile(filePath)
    try {
      await s3.putObject({
        Body: fileContents,
        Bucket: bucket,
        Key: file
      }).promise()
    } catch (e) {
      errFlag = true
    } 
  }
  return errFlag ? 0 : 1
}

// Main script
const start = async () => {
  const changedFiles = await getChangedFiles()
  if (await saveFiles(changedFiles)) {
    store.prev = Date.now()
    await writeFile(`${__dirname}/store.json`, JSON.stringify(store))
  } else {
    console.log('Error saving files to S3')
    process.exit(1)
  }
}

start()