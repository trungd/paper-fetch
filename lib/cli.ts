#!/usr/bin/env node

import { Command, program } from 'commander';
import Paper, { fetchPaper, getPaperQuery, searchPaper } from './paper';
import inquirer from 'inquirer';

const search = async (query: string) => {
    console.log(`Showing results for "${query}"`);
    const papers = await searchPaper(query, ['arxiv', 'semanticScholar']);
    inquirer.prompt(
      [{
        type: 'list',
        loop: false,
        name: 'paper',
        message: 'Select a paper:',
        pageSize: 10,
        choices: papers.map((p) => ({
          name: p.title + ' - ' + p.authors.map((a) => a.fullName).join(', '),
          value: p,
        })),
      }]).then(({paper}: {paper: Paper}) => {
        display(paper);
      })
  }

const display = async (paper: Paper) => {
  const p = await fetchPaper(
      getPaperQuery(paper), 
      ['arxiv', 'semanticScholar', 'paperShelf', 'crossRef', 'openReview']);
  console.log(p.title);
  console.log('Authors:\t', p.authors.map((a) => a.fullName).join(', '));
  console.log("Abstract:\t", p.abstract);
  console.log(p);
  inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What do you want to do?',
    choices: [
      {
        name: 'Back',
        value: 'back',
      }
    ]
  }])
}
  
program.command('search')
  .argument('<string>', 'search query')
  .action(search);

program.action(() => {
  inquirer.prompt([{
    type: 'input',
    name: 'query',
    message: 'Search query:',
  }]).then(({query}: {query: string}) => {
    search(query);
  });
});

program.parse();
