#!/usr/bin/env node

import { program } from 'commander'
import fs from 'fs'
import coreLib from '@actions/core'

import github from '../../script/helpers/github.js'
import { getEnvInputs } from './lib/get-env-inputs.js'
import { createReportIssue, linkReports } from './lib/issue-report.js'

// [start-readme]
//
// This script runs once a week via a scheduled GitHub Action to lint
// the entire content and data directories based on our
// markdownlint.js rules.
//
// If errors are found, it will open up a new issue in the
// docs-content repo with the label "broken content markdown report".
//
// The Content FR will go through the issue and update the content and
// data files accordingly.
//
// [end-readme]

program
  .description('Opens an issue for Content FR with the errors from the weekly content/data linter.')
  .option(
    '-p, --path <path>',
    'provide a path to the errors output json file that will be in the issue body',
  )
  .parse(process.argv)

const { path } = program.opts()

main()
async function main() {
  const errors = fs.readFileSync(`${path}`, 'utf8')
  const core = coreLib
  const { REPORT_REPOSITORY, REPORT_AUTHOR, REPORT_LABEL } = process.env

  const octokit = github()
  // `GITHUB_TOKEN` is optional. If you need the token to post a comment
  // or open an issue report, you might get cryptic error messages from Octokit.
  getEnvInputs(['GITHUB_TOKEN'])

  core.info(`Creating issue for errors...`)

  const reportProps = {
    core,
    octokit,
    reportTitle: `Error(s) in content markdown file(s)`,
    reportBody: JSON.parse(errors),
    reportRepository: REPORT_REPOSITORY,
    reportLabel: REPORT_LABEL,
  }

  await createReportIssue(reportProps)

  const linkProps = {
    core,
    octokit,
    newReport: await createReportIssue(reportProps),
    reportRepository: REPORT_REPOSITORY,
    reportAuthor: REPORT_AUTHOR,
    reportLabel: REPORT_LABEL,
  }

  await linkReports(linkProps)
}
