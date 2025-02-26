const core = require('@actions/core');
const github = require('@actions/github');

const getLink = (org: string, project: string, wiId: string) =>
  encodeURI(`https://dev.azure.com/${org}/${project}/_workitems/edit/${wiId}`);

const makeLink = (org: string, project: string, wiId: string) =>
  `[Work item ${wiId}](${getLink(org, project, wiId)})`;


const main = async () => {
  try {
    const github_token = core.getInput('GITHUB_TOKEN');
    const context = github.context;
    const pull_request_number = context.payload.pull_request.number;

    const organization = core.getInput("organization");
    const project = core.getInput("projectName");
    const workItemLinkRegEx = /AB#(?<wiId>\d+)/g;
    const outputOnly = core.getBooleanInput("outputOnly");
    const titleMatch = workItemLinkRegEx.exec(github.context.payload.pull_request.title);
    const descriptionMatch = workItemLinkRegEx.exec(github.context.payload.pull_request.body);
    
    console.log(titleMatch, descriptionMatch, outputOnly);
    console.log('Title has work item:', workItemLinkRegEx.test(github.context.payload.pull_request ? github.context.payload.pull_request.title : ""))
    console.log('Description has work item:', workItemLinkRegEx.test(github.context.payload.pull_request ? github.context.payload.pull_request.body : ""))

    let link: String | null = null;


    if (titleMatch && titleMatch?.groups?.wiId) {
      link = makeLink(organization, project, titleMatch?.groups?.wiId);
    }
    else if (descriptionMatch && descriptionMatch?.groups?.wiId) {
      link = makeLink(organization, project, descriptionMatch?.groups?.wiId);
    }

    if (link != null) {

      if (outputOnly) {
        core.setOutput('workItemLink', link);
      }
      else {
        const octokit = new github.GitHub(github_token);
        octokit.issues.createComment({
          ...context.repo,
          issue_number: pull_request_number,
          body: link
        });
      }
    }

  } catch (error) {
    core.setFailed(error.message);
  }

};

main();
