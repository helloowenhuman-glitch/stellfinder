import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'

const inboundUrl = 'https://stellfinder.vercel.app/api/inbound/claude'

function submissionError(message) {
  const error = new Error(message)
  error.name = 'SubmissionError'
  return error
}

async function readEventPayload(filePath) {
  let content

  try {
    content = await readFile(filePath, 'utf8')
  } catch {
    throw submissionError('Unable to read the event JSON file.')
  }

  let payload

  try {
    payload = JSON.parse(content)
  } catch {
    throw submissionError('Event JSON must be valid JSON.')
  }

  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.events)) {
    throw submissionError('Event JSON must contain an events array.')
  }

  return payload
}

export async function submitEvents({ filePath, secret, fetchImpl = fetch }) {
  if (!secret) {
    throw submissionError('CLAUDE_WEBHOOK_SECRET is required.')
  }

  const payload = await readEventPayload(filePath)
  let response

  try {
    response = await fetchImpl(inboundUrl, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${secret}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  } catch {
    throw submissionError('Unable to reach the Stellfinder inbound webhook.')
  }

  if (!response.ok) {
    throw submissionError(`The Stellfinder inbound webhook returned HTTP ${response.status}.`)
  }

  try {
    return await response.json()
  } catch {
    throw submissionError('The Stellfinder inbound webhook returned an invalid response.')
  }
}

async function main() {
  const filePath = process.argv[2]

  if (!filePath) {
    throw submissionError('Usage: npm run submit:events -- <event-json-file>')
  }

  const result = await submitEvents({
    filePath,
    secret: process.env.CLAUDE_WEBHOOK_SECRET,
  })

  console.log(`Submitted ${result.received ?? 0} event candidate(s).`)
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  main().catch((error) => {
    console.error(error instanceof Error && error.name === 'SubmissionError'
      ? error.message
      : 'Unable to submit the event JSON.')
    process.exitCode = 1
  })
}
